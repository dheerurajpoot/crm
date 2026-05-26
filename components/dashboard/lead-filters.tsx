"use client";

import { useState } from "react";
import { FormTemplate } from "@/lib/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";

interface LeadFiltersProps {
	filters: {
		search: string;
		formId: string;
		status: string;
		dateRange: string; // 'today', 'yesterday', 'tomorrow', 'custom', 'all'
		dateFrom: string;
		dateTo: string;
	};
	setFilters: (filters: any) => void;
	forms: (FormTemplate & { id: string })[];
}

const statusOptions = [
	{ value: "all", label: "All Status" },
	{ value: "new", label: "New" },
	{ value: "contacted", label: "Contacted" },
	{ value: "qualified", label: "Qualified" },
	{ value: "converted", label: "Converted" },
	{ value: "lost", label: "Lost" },
];

const dateRangeOptions = [
	{ value: "today", label: "Today" },
	{ value: "yesterday", label: "Yesterday" },
	{ value: "tomorrow", label: "Tomorrow" },
	{ value: "all", label: "All Time" },
	{ value: "custom", label: "Custom Range" },
];

export default function LeadFilters({
	filters,
	setFilters,
	forms,
}: LeadFiltersProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleReset = () => {
		setFilters({
			search: "",
			formId: "all",
			status: "all",
			dateRange: "today",
			dateFrom: "",
			dateTo: "",
		});
	};

	const hasActiveFilters =
		filters.search ||
		filters.formId !== "all" ||
		filters.status !== "all" ||
		filters.dateRange !== "today" ||
		filters.dateFrom ||
		filters.dateTo;

	return (
		<Card className='border-border bg-card'>
			<CardContent className='pt-6'>
				<div className='space-y-4'>
					{/* Search Bar */}
					<div className='relative'>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5' />
						<Input
							placeholder='Search leads by name, email, phone...'
							value={filters.search}
							onChange={(e) =>
								setFilters({
									...filters,
									search: e.target.value,
								})
							}
							className='pl-10 bg-input border-border'
						/>
					</div>

					{/* Advanced Filters Toggle */}
					{!isOpen && (
						<Button
							variant='outline'
							onClick={() => setIsOpen(true)}
							className='w-full justify-start gap-2 border-border'>
							<Filter className='w-5 h-5' />
							Advanced Filters
							{hasActiveFilters && (
								<span className='ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5'>
									Active
								</span>
							)}
						</Button>
					)}

					{/* Advanced Filters */}
					{isOpen && (
						<div className='space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50'>
							<div className='flex items-center justify-between mb-4'>
								<h3 className='font-medium text-foreground'>
									Filters
								</h3>
								<Button
									variant='ghost'
									size='sm'
									onClick={() => setIsOpen(false)}
									className='text-muted-foreground hover:text-foreground'>
									<X className='w-4 h-4' />
								</Button>
							</div>

							{/* Form Filter */}
							<div>
								<label className='text-sm font-medium text-foreground block mb-2'>
									Form
								</label>
								<select
									value={filters.formId}
									onChange={(e) =>
										setFilters({
											...filters,
											formId: e.target.value,
										})
									}
									className='w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm'>
									<option value='all'>All Forms</option>
									{forms.map((form) => (
										<option key={form.id} value={form.id}>
											{form.name}
										</option>
									))}
								</select>
							</div>

							{/* Status Filter */}
							<div>
								<label className='text-sm font-medium text-foreground block mb-2'>
									Status
								</label>
								<select
									value={filters.status}
									onChange={(e) =>
										setFilters({
											...filters,
											status: e.target.value,
										})
									}
									className='w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm'>
									{statusOptions.map((option) => (
										<option
											key={option.value}
											value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>

							{/* Date Filter */}
							<div>
								<label className='text-sm font-medium text-foreground block mb-2'>
									Time Period
								</label>
								<div className='flex flex-wrap gap-2'>
									{dateRangeOptions.map((option) => (
										<Button
											key={option.value}
											type='button'
											variant={
												filters.dateRange ===
												option.value
													? "default"
													: "outline"
											}
											size='sm'
											onClick={() =>
												setFilters({
													...filters,
													dateRange: option.value,
												})
											}
											className='text-xs h-8'>
											{option.label}
										</Button>
									))}
								</div>
							</div>

							{/* Custom Date Range */}
							{filters.dateRange === "custom" && (
								<div className='grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200'>
									<div>
										<label className='text-sm font-medium text-foreground block mb-2'>
											From Date
										</label>
										<Input
											type='date'
											value={filters.dateFrom}
											onChange={(e) =>
												setFilters({
													...filters,
													dateFrom: e.target.value,
												})
											}
											className='bg-input border-border'
										/>
									</div>
									<div>
										<label className='text-sm font-medium text-foreground block mb-2'>
											To Date
										</label>
										<Input
											type='date'
											value={filters.dateTo}
											onChange={(e) =>
												setFilters({
													...filters,
													dateTo: e.target.value,
												})
											}
											className='bg-input border-border'
										/>
									</div>
								</div>
							)}

							{/* Reset Button */}
							{hasActiveFilters && (
								<Button
									variant='outline'
									onClick={handleReset}
									className='w-full border-border text-muted-foreground hover:text-foreground'>
									Reset Filters
								</Button>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
