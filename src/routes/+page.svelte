<script lang="ts">
	import { nanoid } from 'nanoid';
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

	function addParticipant() {
		participants = [
			...participants,
			{
				id: nanoid(),
				name: String.fromCharCode(65 + participants.length),
				originalAmount: 0
			}
		];
	}

	function removeParticipant(id: string) {
		if (participants.length <= 1) {
			return;
		}
		participants = participants.filter((participant) => participant.id !== id);
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

	function handleCalculate() {
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
				<Input type="number" bind:value={finalTotal} placeholder="例如 500" min="0" />
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
									/>
								</label>
								<label class="grid gap-1 text-xs font-medium text-muted-foreground">
									<span>原始金額</span>
									<Input
										type="number"
										value={participant.originalAmount}
										oninput={(event) =>
											updateParticipantAmount(participant.id, event.currentTarget.value)}
										min="0"
										step="1"
										placeholder="例如 250"
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
		<Card>
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
				<p class="text-xs text-muted-foreground">
					加總後共 {result.rows
						.reduce((accumulator, row) => accumulator + row.allocatedAmount, 0)
						.toLocaleString()} 元，源自剩餘 {result.leftoverBeforeDistribution} 元的逐一分派。
				</p>
			</CardContent>
		</Card>
	{/if}
</div>
