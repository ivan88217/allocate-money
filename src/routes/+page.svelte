<script lang="ts">
	import { nanoid } from 'nanoid';
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { allocateAmounts, type AllocationParticipantInput, type AllocationRow } from '$lib';

	type ParticipantFormRow = AllocationParticipantInput & {
		name: string;
		error?: string | null;
	};

	const initialParticipants: ParticipantFormRow[] = [
		{ id: nanoid(), name: '', originalAmount: 0 },
		{ id: nanoid(), name: '', originalAmount: 0 },
		{ id: nanoid(), name: '', originalAmount: 0 }
	];

	let participants: ParticipantFormRow[] = [...initialParticipants];
	let finalTotal = 0;
	let errorMessage: string | null = null;
	// 追蹤每個參與者金額輸入框的顯示值（用於處理 0 值的顯示）
	const amountDisplayValues = new Map<string, string>();
	let result: {
		rows: AllocationRow[];
		finalTotal: number;
		originalTotal: number;
		leftoverBeforeDistribution: number;
	} | null = null;

	function reset() {
		participants = [...initialParticipants].map((participant) => ({
			...participant,
			id: nanoid()
		}));
		finalTotal = 0;
		errorMessage = null;
		result = null;
	}

	async function addParticipant() {
		const newParticipantId = nanoid();
		participants = [
			...participants,
			{
				id: newParticipantId,
				name: '',
				originalAmount: 0
			}
		];
		// 等待 DOM 更新後聚焦到新成員的名稱輸入框
		await tick();
		const nameInput = document.querySelector(
			`input[data-participant-id="${newParticipantId}"][data-field="name"]`
		) as HTMLInputElement;
		nameInput?.focus();
	}

	function removeParticipant(id: string) {
		if (participants.length <= 1) {
			return;
		}
		participants = participants.filter((participant) => participant.id !== id);
	}

	/**
	 * 安全地評估數學表達式（只允許數字和基本運算符）
	 */
	function evaluateExpression(expression: string): number {
		// 移除所有空格
		const cleaned = expression.replace(/\s/g, '');
		
		// 只允許數字、小數點、括號和基本運算符
		if (!/^[0-9+\-*/().\s]+$/.test(cleaned)) {
			throw new Error('表達式包含無效字符');
		}
		
		try {
			// 使用 Function 構造函數安全地評估表達式
			// 這比 eval 更安全，因為它不會訪問外部作用域
			const result = Function(`"use strict"; return (${cleaned})`)();
			
			if (typeof result !== 'number' || !Number.isFinite(result)) {
				throw new Error('計算結果無效');
			}
			
			return result;
		} catch (error) {
			throw new Error('表達式計算錯誤');
		}
	}

	function updateParticipantAmount(id: string, value: string) {
		participants = participants.map((participant) =>
			participant.id === id
				? {
						...participant,
						originalAmount: Number.parseInt(value, 10) || 0
					}
				: participant
		);
	}

	function handleAmountFocus(event: Event, participantId: string) {
		const input = event.currentTarget as HTMLInputElement;
		const participant = participants.find((p) => p.id === participantId);
		if (participant && participant.originalAmount === 0) {
			amountDisplayValues.set(participantId, '');
			input.value = '';
		}
	}

	function handleAmountBlur(event: Event, participantId: string) {
		const input = event.currentTarget as HTMLInputElement;
		const value = input.value.trim();
		
		if (value === '') {
			// 直接設置輸入框值為 0
			input.value = '0';
			// 清除顯示值，讓 Svelte 使用實際值
			amountDisplayValues.delete(participantId);
			// 更新狀態為 0
			updateParticipantAmount(participantId, '0');
			return;
		}
		
		// 檢查是否包含運算符（+、-、*、/）
		const hasOperator = /[+\-*/]/.test(value);
		
		if (hasOperator) {
			// 嘗試評估表達式
			try {
				const result = evaluateExpression(value);
				const roundedResult = Math.round(result); // 金額取整數
				
				// 更新輸入框顯示計算結果
				input.value = String(roundedResult);
				// 清除顯示值，讓 Svelte 使用實際值
				amountDisplayValues.delete(participantId);
				// 更新狀態
				updateParticipantAmount(participantId, String(roundedResult));
			} catch (error) {
				// 如果表達式無效，恢復為 0
				input.value = '0';
				amountDisplayValues.delete(participantId);
				updateParticipantAmount(participantId, '0');
			}
		} else {
			// 普通數字輸入
			const numValue = Number.parseInt(value, 10);
			if (isNaN(numValue)) {
				input.value = '0';
				amountDisplayValues.delete(participantId);
				updateParticipantAmount(participantId, '0');
			} else {
				updateParticipantAmount(participantId, value);
				amountDisplayValues.delete(participantId);
			}
		}
	}

	function getAmountDisplayValue(participantId: string, originalAmount: number): number | string {
		if (amountDisplayValues.has(participantId)) {
			return amountDisplayValues.get(participantId) || '';
		}
		return originalAmount;
	}

	function updateParticipantName(id: string, value: string) {
		participants = participants.map((participant) =>
			participant.id === id
				? {
						...participant,
						name: value
					}
				: participant
		);
	}

	function normalizeParticipants(): AllocationParticipantInput[] {
		return participants.map((participant, index) => ({
			id: participant.id,
			name: participant.name || `成員 ${index + 1}`,
			originalAmount: participant.originalAmount
		}));
	}

	function validate(): boolean {
		errorMessage = null;
		let firstError: string | null = null;
		participants = participants.map((participant) => {
			let error: string | null = null;
			if (!participant.name) {
				error = '請輸入姓名';
			}
			if (participant.originalAmount < 0) {
				error = '金額不可為負';
			}
			if (!Number.isInteger(participant.originalAmount)) {
				error = '金額需為整數';
			}
			if (error && !firstError) {
				firstError = error;
			}

			return {
				...participant,
				error
			};
		});
		if (!Number.isInteger(finalTotal)) {
			firstError = firstError ?? '折扣後總金額需為整數';
		}
		if (finalTotal < 0) {
			firstError = firstError ?? '折扣後總金額不可為負';
		}
		if (participants.some((participant) => participant.originalAmount < 0)) {
			firstError = firstError ?? '成員金額不可為負';
		}
		if (participants.every((participant) => participant.originalAmount === 0)) {
			firstError = firstError ?? '至少一位成員需有金額';
		}
		errorMessage = firstError;
		return !firstError;
	}

	async function handleCalculate() {
		console.log('handleCalculate');
		if (!validate()) {
			console.log('validate failed');
			result = null;
			return;
		}
		try {
			const allocationResult = allocateAmounts(finalTotal, normalizeParticipants());
			result = allocationResult;
			errorMessage = null;
			// 等待 DOM 更新後捲動到結果區域
			await tick();
			const resultCard = document.getElementById('result-card');
			if (resultCard) {
				resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		} catch (error) {
			result = null;
			errorMessage = error instanceof Error ? error.message : '發生未知錯誤';
		}
	}
</script>

<div class="mx-auto flex max-w-4xl flex-col gap-8 p-6">
	<header class="space-y-2 text-center">
		<h1 class="text-3xl font-semibold">攤派金額計算</h1>
		<p class="text-sm text-muted-foreground">
			依照個人原始金額比例，分配折扣後總金額，並處理台幣無小數的分派流程。
		</p>
	</header>
	<Card>
		<CardHeader class="space-y-2">
			<CardTitle class="text-xl">輸入資訊</CardTitle>
		</CardHeader>
		<CardContent class="grid gap-4">
			<label class="grid gap-2">
				<span class="text-sm font-medium">折扣後總金額</span>
				<Input
					type="text"
					value={finalTotal === 0 ? '' : String(finalTotal)}
					oninput={(event) => {
						const value = event.currentTarget.value.trim();
						if (value === '') {
							finalTotal = 0;
							return;
						}
						// 檢查是否包含運算符
						if (/[+\-*/]/.test(value)) {
							try {
								const result = evaluateExpression(value);
								finalTotal = Math.round(result);
							} catch {
								// 如果表達式無效，暫時不更新
							}
						} else {
							const numValue = Number.parseInt(value, 10);
							if (!isNaN(numValue)) {
								finalTotal = numValue;
							}
						}
					}}
					onblur={(event) => {
						const input = event.currentTarget as HTMLInputElement;
						const value = input.value.trim();
						if (value === '') {
							finalTotal = 0;
							input.value = '0';
							return;
						}
						if (/[+\-*/]/.test(value)) {
							try {
								const result = evaluateExpression(value);
								finalTotal = Math.round(result);
								input.value = String(finalTotal);
							} catch {
								finalTotal = 0;
								input.value = '0';
							}
						} else {
							const numValue = Number.parseInt(value, 10);
							if (isNaN(numValue)) {
								finalTotal = 0;
								input.value = '0';
							} else {
								finalTotal = numValue;
								input.value = String(finalTotal);
							}
						}
					}}
					onkeydown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							(event.currentTarget as HTMLInputElement).blur();
						}
					}}
					placeholder="例如 500 或 400+100"
					inputmode="numeric"
					lang="en"
				/>
			</label>
			<div class="space-y-3">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h3 class="text-lg font-medium" id="participants-heading">成員清單</h3>
					<Button type="button" variant="outline" onclick={addParticipant}>新增成員</Button>
				</div>
				<div class="grid gap-3 md:grid-cols-2" role="group" aria-labelledby="participants-heading">
					{#each participants as participant (participant.id)}
						<Card class="gap-3 p-3">
							<CardContent class="grid gap-2 px-0 py-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end sm:gap-3">
								<label class="grid gap-1 text-xs font-medium text-muted-foreground">
									<span>姓名</span>
									<Input
										type="text"
										value={participant.name}
										oninput={(event) =>
											updateParticipantName(participant.id, event.currentTarget.value)}
										placeholder="請輸入名稱"
										data-participant-id={participant.id}
										data-field="name"
									/>
								</label>
								<label class="grid gap-1 text-xs font-medium text-muted-foreground">
									<span>原始金額</span>
									<Input
										type="text"
										value={getAmountDisplayValue(participant.id, participant.originalAmount)}
										oninput={(event) => {
											const value = event.currentTarget.value;
											amountDisplayValues.set(participant.id, value);
											// 暫時不更新數值，等失去焦點時再計算
										}}
										onfocus={(event) => handleAmountFocus(event, participant.id)}
										onblur={(event) => handleAmountBlur(event, participant.id)}
										onkeydown={async (event) => {
											const isLastParticipant = participants[participants.length - 1].id === participant.id;
											if (event.key === 'Tab' && !event.shiftKey && isLastParticipant) {
												event.preventDefault();
												event.stopPropagation();
												event.stopImmediatePropagation();
												await addParticipant();
											}
											// 允許 Enter 鍵觸發計算
											if (event.key === 'Enter') {
												event.preventDefault();
												(event.currentTarget as HTMLInputElement).blur();
											}
										}}
										placeholder="例如 250 或 100+50"
										inputmode="numeric"
										lang="en"
										data-participant-id={participant.id}
										data-field="amount"
									/>
								</label>
							</CardContent>
							<CardFooter class="flex justify-end gap-2 px-0 pt-2">
								<Button
									type="button"
									variant="destructive"
									onclick={() => removeParticipant(participant.id)}
									disabled={participants.length <= 1}
									class="w-full sm:w-auto"
									tabindex={-1}
								>
									移除
								</Button>
							</CardFooter>
							{#if participant.error}
								<CardFooter class="px-0 pt-0">
									<p class="text-sm text-destructive">{participant.error}</p>
								</CardFooter>
							{/if}
						</Card>
					{/each}
				</div>
			</div>
		</CardContent>
		<CardFooter class="flex justify-end gap-2">
			<Button type="button" variant="outline" onclick={reset}>重置</Button>
			<Button type="button" onclick={handleCalculate}>計算</Button>
		</CardFooter>
	</Card>
	{#if errorMessage}
		<p
			class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
		>
			{errorMessage}
		</p>
	{/if}
	{#if result}
		<Card id="result-card">
			<CardHeader class="space-y-1">
				<CardTitle class="text-xl">分配結果</CardTitle>
				<CardDescription>
					原始總金額 {result.originalTotal.toLocaleString()} 元，折扣後總金額 {result.finalTotal.toLocaleString()} 元。
				</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-4">
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y text-sm">
						<thead>
							<tr class="bg-muted/50">
								<th class="px-4 py-2 text-left">成員</th>
								<th class="px-4 py-2 text-right">原始金額</th>
								<th class="px-4 py-2 text-right">比例</th>
								<th class="px-4 py-2 text-right">理論值</th>
								<th class="px-4 py-2 text-right">整數分派後餘額</th>
								<th class="px-4 py-2 text-right">分派金額</th>
							</tr>
						</thead>
						<tbody class="divide-y">
							{#each result.rows as row}
								<tr>
									<td class="px-4 py-2 font-medium">{row.name ?? '未知'}</td>
									<td class="px-4 py-2 text-right">{row.originalAmount.toLocaleString()}</td>
									<td class="px-4 py-2 text-right">{(row.weight * 100).toFixed(2)}%</td>
									<td class="px-4 py-2 text-right">{row.exactShare.toFixed(2)}</td>
									<td class="px-4 py-2 text-right">{row.extraShare}</td>
									<td class="px-4 py-2 text-right">{row.allocatedAmount.toLocaleString()}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
