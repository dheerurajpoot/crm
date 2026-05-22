"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isMemberOfOrganization } from "@/lib/firestore";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import MobileNav from "@/components/dashboard/mobile-nav";
import DashboardHeader from "@/components/dashboard/dashboard-header";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const { currentUser, userData, loading, logout } = useAuth();

	useEffect(() => {
		if (!loading && !currentUser) {
			router.push("/login");
			return;
		}

		const checkAccess = async () => {
			if (!loading && currentUser && userData) {
				if (!userData.organizationId) {
					await logout();
					window.location.href = "/login?error=removed";
					return;
				}

				// Extra security check: verify membership in the organization's members subcollection
				const isStillMember = await isMemberOfOrganization(
					userData.organizationId,
					currentUser.uid,
				);
				if (!isStillMember) {
					await logout();
					window.location.href = "/login?error=removed";
				}
			}
		};

		checkAccess();
	}, [currentUser, userData, loading, logout, router]);

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-background'>
				<div className='text-center'>
					<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
					<p className='mt-4 text-foreground'>Loading...</p>
				</div>
			</div>
		);
	}

	if (!currentUser || !userData || !userData.organizationId) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-background'>
				<div className='text-center'>
					<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
					<p className='mt-4 text-foreground'>Redirecting...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flex h-screen bg-background overflow-hidden'>
			{/* Desktop Sidebar */}
			<div className='hidden md:flex md:flex-col md:w-64 md:border-r md:border-border'>
				<DashboardNav />
			</div>

			{/* Main Content */}
			<div className='flex-1 flex flex-col overflow-hidden'>
				<DashboardHeader />
				<div className='flex-1 overflow-auto'>{children}</div>
			</div>

			{/* Mobile Navigation */}
			<div className='md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card'>
				<MobileNav />
			</div>
		</div>
	);
}
