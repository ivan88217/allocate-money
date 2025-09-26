export interface AllocationParticipantInput {
	id: string;
	name?: string | null;
	originalAmount: number;
}

export interface AllocationRow extends AllocationParticipantInput {
	readonly weight: number;
	readonly exactShare: number;
	readonly baseShare: number;
	readonly fractionalShare: number;
	readonly extraShare: number;
	readonly allocatedAmount: number;
	readonly originalIndex: number;
}

export interface AllocationResult {
	readonly originalTotal: number;
	readonly finalTotal: number;
	readonly leftoverBeforeDistribution: number;
	readonly rows: AllocationRow[];
}

export function allocateAmounts(
	finalTotal: number,
	participants: AllocationParticipantInput[]
): AllocationResult {
	if (!Number.isFinite(finalTotal)) {
		throw new Error("折扣後總金額必須為有效數值");
	}
	if (!Number.isInteger(finalTotal)) {
		throw new Error("折扣後總金額必須為整數");
	}
	if (finalTotal < 0) {
		throw new Error("折扣後總金額不可為負數");
	}
	if (participants.length === 0) {
		throw new Error("至少需要一位成員");
	}

	const sanitized = participants.map((participant, index) => {
		const amount = participant.originalAmount;
		if (!Number.isFinite(amount)) {
			throw new Error("成員的原始金額必須為有效數值");
		}
		if (!Number.isInteger(amount)) {
			throw new Error("成員的原始金額必須為整數");
		}
		if (amount < 0) {
			throw new Error("成員的原始金額不可為負數");
		}
		return {
			id: participant.id,
			name: participant.name ?? null,
			originalAmount: amount,
			originalIndex: index,
		};
	});

	const originalTotal = sanitized.reduce((sum, participant) => sum + participant.originalAmount, 0);
	if (originalTotal <= 0) {
		throw new Error("原始金額總和必須大於 0");
	}

	const rows = sanitized.map((participant) => {
		const weight = participant.originalAmount / originalTotal;
		const exactShare = finalTotal * weight;
		const baseShare = Math.floor(exactShare);
		const fractionalShare = exactShare - baseShare;
		return {
			...participant,
			weight,
			exactShare,
			baseShare,
			fractionalShare,
			extraShare: 0,
			allocatedAmount: baseShare,
		} satisfies AllocationRow;
	});

	const baseTotal = rows.reduce((sum, row) => sum + row.baseShare, 0);
	let remaining = Math.round(finalTotal - baseTotal);
	const leftoverBeforeDistribution = remaining;

	if (remaining > 0 && rows.length > 0) {
		const priorityOrder = [...rows]
			.map((row, idx) => ({ ...row, idx }))
			.sort((a, b) => {
				if (b.fractionalShare !== a.fractionalShare) {
					return b.fractionalShare - a.fractionalShare;
				}
				if (b.originalAmount !== a.originalAmount) {
					return b.originalAmount - a.originalAmount;
				}
				return a.idx - b.idx;
			});

		let cursor = 0;
		const cycleLength = priorityOrder.length;
		while (remaining > 0) {
			const target = priorityOrder[cursor % cycleLength];
			rows[target.idx] = {
				...rows[target.idx],
				extraShare: rows[target.idx].extraShare + 1,
				allocatedAmount: rows[target.idx].allocatedAmount + 1,
			};
			remaining -= 1;
			cursor += 1;
			if (cursor > cycleLength * 10_000) {
				throw new Error("分配時發生未預期的循環錯誤");
			}
		}
	}

	const allocatedSum = rows.reduce((sum, row) => sum + row.allocatedAmount, 0);
	if (allocatedSum !== finalTotal) {
		const difference = finalTotal - allocatedSum;
		const adjustmentIndex = rows.findIndex((row) => row.allocatedAmount + difference >= 0);
		if (adjustmentIndex === -1) {
			throw new Error("分配結果與折扣後金額不相符");
		}
		const rowToAdjust = rows[adjustmentIndex];
		rows[adjustmentIndex] = {
			...rowToAdjust,
			allocatedAmount: rowToAdjust.allocatedAmount + difference,
			extraShare: rowToAdjust.extraShare + difference,
		};
	}

	return {
		originalTotal,
		finalTotal,
		leftoverBeforeDistribution: Math.max(0, leftoverBeforeDistribution),
		rows,
	};
}

