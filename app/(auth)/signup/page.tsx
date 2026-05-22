"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, UserPlus } from "lucide-react";

function SignupForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { signup, loading: authLoading } = useAuth();
	
	const invitedOrgId = searchParams.get('orgId') || '';
	const invitedEmail = searchParams.get('email') || '';
	const invitedRole = searchParams.get('role') || '';
	const invitedPerms = searchParams.get('permissions') || '';

	const [displayName, setDisplayName] = useState("");
	const [organizationName, setOrganizationName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	useEffect(() => {
		if (invitedEmail) {
			setEmail(invitedEmail);
		}
	}, [invitedEmail]);

	const passwordsMismatch =
		confirmPassword.length > 0 && password !== confirmPassword;
	const passwordsMatch =
		password.length > 0 &&
		confirmPassword.length > 0 &&
		password === confirmPassword;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		setLoading(true);

		try {
			if (invitedOrgId) {
				const parsedPerms = invitedPerms ? JSON.parse(decodeURIComponent(invitedPerms)) : [];
				await signup(email, password, displayName, "", invitedOrgId, invitedRole as any, parsedPerms);
			} else {
				await signup(email, password, displayName, organizationName);
			}
			router.push("/dashboard");
		} catch (err: any) {
			setError(err.message || "Failed to sign up");
		} finally {
			setLoading(false);
		}
	};

	if (authLoading) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-background'>
				<div className='text-center'>
					<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
					<p className='mt-4 text-foreground'>Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-card p-4'>
			<div className='w-full max-w-md'>
				<div className='mb-8 text-center'>
					<div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent text-accent-foreground mb-4'>
						<UserPlus className='w-6 h-6' />
					</div>
					<h1 className='text-3xl font-bold text-foreground'>
						LeadFlow CRM
					</h1>
					<p className='mt-2 text-muted-foreground'>
						Start managing leads professionally
					</p>
				</div>

				<Card className='border-border'>
					<CardHeader>
						<CardTitle>Create Account</CardTitle>
						<CardDescription>
							Set up your CRM account and organization
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className='space-y-4'>
							{error && (
								<div className='p-3 rounded-lg bg-red-500/10 text-red-600 flex items-start gap-2'>
									<AlertCircle className='w-5 h-5 flex-shrink-0 mt-0.5' />
									<span className='text-sm'>{error}</span>
								</div>
							)}

							<div className='space-y-2'>
								<label className='text-sm font-medium text-foreground'>
									Full Name
								</label>
								<Input
									type='text'
									placeholder='John Doe'
									value={displayName}
									onChange={(e) =>
										setDisplayName(e.target.value)
									}
									required
									className='bg-input border-border'
								/>
							</div>

							{!invitedOrgId && (
								<div className='space-y-2'>
									<label className='text-sm font-medium text-foreground'>
										Organization Name
									</label>
									<Input
										type='text'
										placeholder='Your Company'
										value={organizationName}
										onChange={(e) =>
											setOrganizationName(e.target.value)
										}
										required
										className='bg-input border-border'
									/>
								</div>
							)}

							<div className='space-y-2'>
								<label className='text-sm font-medium text-foreground'>
									Email
								</label>
								<Input
									type='email'
									placeholder='you@example.com'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={!!invitedEmail}
									className='bg-input border-border disabled:opacity-60'
								/>
							</div>

							<div className='space-y-2'>
								<label className='text-sm font-medium text-foreground'>
									Password
								</label>
								<InputGroup className='bg-input border-border'>
									<InputGroupInput
										type={
											showPassword ? "text" : "password"
										}
										placeholder='At least 6 characters'
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										required
										autoComplete='new-password'
									/>
									<InputGroupAddon align='inline-end'>
										<InputGroupButton
											aria-label={
												showPassword
													? "Hide password"
													: "Show password"
											}
											onClick={() =>
												setShowPassword((prev) => !prev)
											}
											size='icon-sm'>
											{showPassword ? (
												<EyeOff className='w-4 h-4' />
											) : (
												<Eye className='w-4 h-4' />
											)}
										</InputGroupButton>
									</InputGroupAddon>
								</InputGroup>
							</div>

							<div className='space-y-2'>
								<label className='text-sm font-medium text-foreground'>
									Confirm Password
								</label>
								<InputGroup className='bg-input border-border'>
									<InputGroupInput
										type={
											showConfirmPassword
												? "text"
												: "password"
										}
										placeholder='Confirm your password'
										value={confirmPassword}
										onChange={(e) =>
											setConfirmPassword(e.target.value)
										}
										required
										autoComplete='new-password'
										aria-invalid={passwordsMismatch}
									/>
									<InputGroupAddon align='inline-end'>
										<InputGroupButton
											aria-label={
												showConfirmPassword
													? "Hide password"
													: "Show password"
											}
											onClick={() =>
												setShowConfirmPassword(
													(prev) => !prev,
												)
											}
											size='icon-sm'>
											{showConfirmPassword ? (
												<EyeOff className='w-4 h-4' />
											) : (
												<Eye className='w-4 h-4' />
											)}
										</InputGroupButton>
									</InputGroupAddon>
								</InputGroup>
								{passwordsMismatch && (
									<p className='text-xs text-red-600'>
										Passwords do not match
									</p>
								)}
								{passwordsMatch && (
									<p className='text-xs text-green-600'>
										Passwords match
									</p>
								)}
							</div>

							<Button
								type='submit'
								disabled={loading || passwordsMismatch}
								className='w-full bg-accent hover:bg-accent/90 text-accent-foreground'>
								{loading
									? "Creating account..."
									: "Create Account"}
							</Button>
						</form>

						<div className='mt-6 pt-6 border-t border-border text-center'>
							<p className='text-sm text-muted-foreground'>
								Already have an account?{" "}
								<Link
									href='/login'
									className='text-primary hover:underline font-medium'>
									Sign in
								</Link>
							</p>
						</div>
					</CardContent>
				</Card>

				<p className='mt-8 text-center text-xs text-muted-foreground'>
					© 2024 LeadFlow CRM. All rights reserved.
				</p>
			</div>
		</div>
	);
}

export default function SignupPage() {
	return (
		<Suspense fallback={
			<div className='flex items-center justify-center min-h-screen bg-background'>
				<div className='text-center'>
					<div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
					<p className='mt-4 text-foreground'>Loading signup...</p>
				</div>
			</div>
		}>
			<SignupForm />
		</Suspense>
	);
}
