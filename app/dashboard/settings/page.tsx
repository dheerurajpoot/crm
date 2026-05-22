"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Lock, Loader2, Trash2, AlertTriangle } from "lucide-react";
import {
	getOrganization,
	updateOrganization,
	deleteOrganization,
} from "@/lib/firestore";

export default function SettingsPage() {
	const { userData, isAdmin, resetPassword, logout } = useAuth();
	const [orgName, setOrgName] = useState("");
	const [loadingOrg, setLoadingOrg] = useState(false);
	const [updatingOrg, setUpdatingOrg] = useState(false);
	const [orgMessage, setOrgMessage] = useState("");
	const [orgError, setOrgError] = useState("");
	const [resetting, setResetting] = useState(false);
	const [deletingOrg, setDeletingOrg] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	useEffect(() => {
		const loadOrgName = async () => {
			if (!userData?.organizationId) return;
			setLoadingOrg(true);
			try {
				const org = await getOrganization(userData.organizationId);
				if (org) {
					setOrgName(org.name);
				}
			} catch (err) {
				console.error("[Settings] Error fetching organization:", err);
			} finally {
				setLoadingOrg(false);
			}
		};
		loadOrgName();
	}, [userData?.organizationId]);

	const handleUpdateOrg = async () => {
		if (!userData?.organizationId || !orgName.trim()) return;
		setUpdatingOrg(true);
		setOrgMessage("");
		setOrgError("");
		try {
			await updateOrganization(userData.organizationId, {
				name: orgName,
			});
			setOrgMessage("Organization name updated successfully!");
		} catch (err: any) {
			setOrgError(err.message || "Failed to update organization name");
		} finally {
			setUpdatingOrg(false);
		}
	};

	const handleResetPassword = async () => {
		if (!userData?.email) return;
		setResetting(true);
		setOrgMessage("");
		setOrgError("");
		try {
			await resetPassword(userData.email);
			setOrgMessage("Password reset link sent to your email!");
		} catch (err: any) {
			setOrgError(err.message || "Failed to send reset link");
		} finally {
			setResetting(false);
		}
	};

	const handleDeleteOrganization = async () => {
		if (!userData?.organizationId || !isAdmin) return;
		setDeletingOrg(true);
		setOrgError("");
		try {
			await deleteOrganization(userData.organizationId);
			await logout();
			window.location.href = "/login";
		} catch (err: any) {
			setOrgError(err.message || "Failed to delete organization");
			setDeletingOrg(false);
			setShowDeleteConfirm(false);
		}
	};

	if (!isAdmin) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<Card className='border-border bg-card max-w-md w-full mx-4'>
					<CardContent className='py-12'>
						<div className='text-center'>
							<Shield className='w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50' />
							<h3 className='text-lg font-medium text-foreground mb-2'>
								Admin Access Required
							</h3>
							<p className='text-muted-foreground'>
								Only administrators can access settings
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='flex-1 overflow-auto'>
			<div className='p-4 md:p-8 space-y-6 mb-20 md:mb-0 max-w-4xl'>
				{/* Header */}
				<div>
					<h1 className='text-3xl font-bold text-foreground'>
						Settings
					</h1>
					<p className='text-muted-foreground mt-2'>
						Manage your organization and preferences
					</p>
				</div>

				{/* Account Settings */}
				<Card className='border-border bg-card'>
					<CardHeader>
						<CardTitle>Account Settings</CardTitle>
						<CardDescription>
							Your personal account information
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<label className='text-sm font-medium text-foreground block mb-2'>
								Display Name
							</label>
							<Input
								type='text'
								value={userData?.displayName || ""}
								disabled
								className='bg-input border-border disabled:opacity-50'
							/>
						</div>

						<div>
							<label className='text-sm font-medium text-foreground block mb-2'>
								Email
							</label>
							<Input
								type='email'
								value={userData?.email || ""}
								disabled
								className='bg-input border-border disabled:opacity-50'
							/>
						</div>

						<div>
							<label className='text-sm font-medium text-foreground block mb-2'>
								Role
							</label>
							<Input
								type='text'
								value={
									userData?.role
										? userData.role
												.charAt(0)
												.toUpperCase() +
											userData.role.slice(1)
										: ""
								}
								disabled
								className='bg-input border-border disabled:opacity-50'
							/>
						</div>
					</CardContent>
				</Card>

				{/* Security Settings */}
				<Card className='border-border bg-card'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Lock className='w-5 h-5 text-primary' />
							Security
						</CardTitle>
						<CardDescription>
							Manage your account security
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='p-4 rounded-lg bg-muted/20 border border-border/50'>
							<h4 className='font-medium text-foreground mb-2'>
								Password Reset
							</h4>
							<p className='text-sm text-muted-foreground mb-4'>
								Receive a password reset link via email to
								change your password.
							</p>
							<Button
								onClick={handleResetPassword}
								disabled={resetting}
								className='bg-primary hover:bg-primary/90 text-primary-foreground'>
								{resetting ? (
									<>
										<Loader2 className='w-4 h-4 mr-2 animate-spin' />
										Sending Link...
									</>
								) : (
									"Send Reset Link"
								)}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Organization Management */}
				<Card className='border-border bg-card'>
					<CardHeader>
						<CardTitle>Organization Management</CardTitle>
						<CardDescription>
							Manage your organization details and lifecycle
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div>
							<label className='text-sm font-medium text-foreground block mb-2'>
								Organization Name
							</label>
							<div className='flex gap-2'>
								<Input
									type='text'
									value={orgName}
									onChange={(e) => setOrgName(e.target.value)}
									placeholder='Organization Name'
									disabled={loadingOrg || updatingOrg}
									className='bg-input border-border'
								/>
								<Button
									onClick={handleUpdateOrg}
									disabled={
										loadingOrg ||
										updatingOrg ||
										!orgName.trim()
									}
									className='bg-primary hover:bg-primary/90 text-primary-foreground shrink-0'>
									{updatingOrg ? (
										<>
											<Loader2 className='w-4 h-4 mr-2 animate-spin' />
											Saving...
										</>
									) : (
										"Save Name"
									)}
								</Button>
							</div>
						</div>

						<div className='pt-6 border-t border-border'>
							<div className='p-4 rounded-lg bg-red-500/5 border border-red-500/20'>
								<div className='flex items-start gap-3'>
									<AlertTriangle className='w-5 h-5 text-red-500 mt-0.5' />
									<div className='space-y-1 flex-1'>
										<h4 className='font-medium text-red-600'>
											Danger Zone
										</h4>
										<p className='text-sm text-red-600/80'>
											Deleting your organization will
											permanently remove all data, leads,
											and member access. This action
											cannot be undone.
										</p>

										{!showDeleteConfirm ? (
											<Button
												variant='destructive'
												onClick={() =>
													setShowDeleteConfirm(true)
												}
												className='mt-4'>
												<Trash2 className='w-4 h-4 mr-2' />
												Delete Organization
											</Button>
										) : (
											<div className='mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20 space-y-4'>
												<p className='text-sm font-bold text-red-600'>
													Are you absolutely sure?
													This action is permanent.
												</p>
												<div className='flex gap-3'>
													<Button
														variant='destructive'
														disabled={deletingOrg}
														onClick={
															handleDeleteOrganization
														}>
														{deletingOrg
															? "Deleting..."
															: "Yes, Delete Everything"}
													</Button>
													<Button
														variant='outline'
														onClick={() =>
															setShowDeleteConfirm(
																false,
															)
														}
														disabled={deletingOrg}>
														Cancel
													</Button>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{orgMessage && (
					<div className='p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium'>
						{orgMessage}
					</div>
				)}
				{orgError && (
					<div className='p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium'>
						{orgError}
					</div>
				)}
			</div>
		</div>
	);
}
