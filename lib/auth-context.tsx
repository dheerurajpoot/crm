"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";
import {
	User as FirebaseUser,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";
import {
	addTeamMember,
	createOrganization,
	createUser,
	getUser,
	removeTeamMember,
} from "./firestore";
import { User, UserRole, Permission } from "./schemas";

interface AuthContextType {
	currentUser: FirebaseUser | null;
	userData: (User & { id: string }) | null;
	setUserData: React.Dispatch<
		React.SetStateAction<(User & { id: string }) | null>
	>;
	loading: boolean;
	error: string | null;
	signup: (
		email: string,
		password: string,
		displayName: string,
		organizationName: string,
		invitedOrgId?: string,
		invitedRole?: UserRole,
		invitedPermissions?: Permission[],
	) => Promise<void>;
	signin: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	hasPermission: (permission: Permission) => boolean;
	isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
	const [userData, setUserData] = useState<(User & { id: string }) | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const reason: unknown = event.reason;
			const name =
				reason && typeof reason === "object" && "name" in reason
					? String((reason as any).name)
					: "";
			const message =
				reason && typeof reason === "object" && "message" in reason
					? String((reason as any).message)
					: String(reason ?? "");

			if (
				name === "AbortError" ||
				message.includes("The user aborted a request")
			) {
				event.preventDefault();
			}
		};

		window.addEventListener("unhandledrejection", handleUnhandledRejection);
		return () => {
			window.removeEventListener(
				"unhandledrejection",
				handleUnhandledRejection,
			);
		};
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setLoading(true);
			try {
				setCurrentUser(firebaseUser);
				if (firebaseUser) {
					const user = await getUser(firebaseUser.uid);
					setUserData(
						user ? { ...user, id: firebaseUser.uid } : null,
					);
				} else {
					setUserData(null);
				}
			} catch (err) {
				console.error("[v0] Auth error:", err);
				setError("Failed to load user data");
			} finally {
				setLoading(false);
			}
		});

		return unsubscribe;
	}, []);

	const signup = async (
		email: string,
		password: string,
		displayName: string,
		organizationName: string,
		invitedOrgId?: string,
		invitedRole?: UserRole,
		invitedPermissions?: Permission[],
	) => {
		try {
			setError(null);
			const result = await createUserWithEmailAndPassword(
				auth,
				email,
				password,
			);

			let orgId = invitedOrgId;
			let role = invitedRole || UserRole.AGENT;
			let permissions = invitedPermissions || [Permission.VIEW];

			if (!orgId) {
				orgId = await createOrganization({
					name: organizationName,
					createdById: result.user.uid,
				});
				role = UserRole.ADMIN;
				permissions = [
					Permission.VIEW,
					Permission.EDIT,
					Permission.DELETE,
					Permission.EXPORT,
				];
			}

			const newUser: User = {
				uid: result.user.uid,
				email,
				displayName,
				organizationId: orgId,
				role,
				permissions,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
			};
			await createUser(result.user.uid, newUser);
			await addTeamMember(orgId, result.user.uid, role, permissions);

			// Clean up pending invite document (keyed by email)
			try {
				await removeTeamMember(orgId, email);
			} catch (cleanupErr) {
				console.warn(
					"[Signup] Pending invite cleanup warning:",
					cleanupErr,
				);
			}

			setUserData({ ...newUser, id: result.user.uid });
		} catch (err: any) {
			setError(err.message || "Failed to sign up");
			throw err;
		}
	};

	const signin = async (email: string, password: string) => {
		try {
			setError(null);
			await signInWithEmailAndPassword(auth, email, password);
		} catch (err: any) {
			setError(err.message || "Failed to sign in");
			throw err;
		}
	};

	const logout = async () => {
		try {
			setError(null);
			await signOut(auth);
			setCurrentUser(null);
			setUserData(null);
		} catch (err: any) {
			setError(err.message || "Failed to sign out");
			throw err;
		}
	};

	const resetPassword = async (email: string) => {
		try {
			setError(null);
			await sendPasswordResetEmail(auth, email);
		} catch (err: any) {
			setError(err.message || "Failed to send reset email");
			throw err;
		}
	};

	const hasPermission = (permission: Permission): boolean => {
		if (!userData) return false;
		return userData.permissions.includes(permission);
	};

	const isAdmin = userData?.role === UserRole.ADMIN;

	const value: AuthContextType = {
		currentUser,
		userData,
		setUserData,
		loading,
		error,
		signup,
		signin,
		logout,
		resetPassword,
		hasPermission,
		isAdmin,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
