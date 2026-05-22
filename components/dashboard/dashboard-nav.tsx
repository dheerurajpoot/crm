"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
	LayoutDashboard,
	FileText,
	Users,
	Settings,
	LogOut,
	Menu,
	User,
} from "lucide-react";
import { useState } from "react";

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/dashboard/leads", label: "Leads", icon: FileText },
	{ href: "/dashboard/forms", label: "Forms", icon: Menu, adminOnly: true },
	{ href: "/dashboard/team", label: "Team", icon: Users, adminOnly: true },
	{ href: "/dashboard/profile", label: "Profile", icon: User },
	{
		href: "/dashboard/settings",
		label: "Settings",
		icon: Settings,
		adminOnly: true,
	},
];

export default function DashboardNav() {
	const router = useRouter();
	const pathname = usePathname();
	const { logout, userData, isAdmin } = useAuth();

	const handleLogout = async () => {
		try {
			await logout();
			router.push("/login");
		} catch (error) {
			console.error("[v0] Logout error:", error);
		}
	};

	const filteredNavItems = navItems.filter(
		(item) => !item.adminOnly || isAdmin,
	);

	return (
		<div className='flex flex-col h-full bg-card'>
			{/* Logo/Header */}
			<div className='p-6 border-b border-border'>
				<h1 className='text-xl font-bold text-foreground'>LeadFlow</h1>
				<p className='text-xs text-muted-foreground mt-1'>CRM System</p>
			</div>

			{/* Navigation Items */}
			<nav className='flex-1 overflow-auto p-4 space-y-2'>
				{filteredNavItems.map((item) => {
					const Icon = item.icon;
					const isActive =
						pathname === item.href ||
						pathname.startsWith(item.href + "/");
					return (
						<Link key={item.href} href={item.href}>
							<Button
								variant='ghost'
								className={`w-full cursor-pointer justify-start gap-3 ${
									isActive
										? "bg-primary/10 text-primary hover:bg-primary/20"
										: "text-muted-foreground hover:bg-muted/50"
								}`}>
								<Icon className='w-5 h-5' />
								<span>{item.label}</span>
							</Button>
						</Link>
					);
				})}
			</nav>

			{/* User Info & Logout */}
			<div className='p-4 border-t border-border space-y-3'>
				{userData && (
					<div className='px-3 py-2 rounded-lg bg-muted/30'>
						<p className='text-xs font-medium text-foreground truncate'>
							{userData.displayName || userData.email}
						</p>
						<p className='text-xs text-muted-foreground capitalize'>
							{userData.role}
						</p>
					</div>
				)}
				<Button
					onClick={handleLogout}
					variant='outline'
					className='w-full justify-start gap-3 border-border text-foreground hover:bg-destructive/10 hover:text-destructive'>
					<LogOut className='w-5 h-5' />
					<span>Logout</span>
				</Button>
			</div>
		</div>
	);
}
