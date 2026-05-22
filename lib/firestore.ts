import {
	collection,
	doc,
	setDoc,
	getDoc,
	getDocs,
	query,
	where,
	orderBy,
	updateDoc,
	deleteDoc,
	QueryConstraint,
	Timestamp,
	writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
	User,
	FormTemplate,
	Lead,
	LeadActivity,
	Organization,
	UserRole,
	Permission,
} from "./schemas";

// ========== Users ==========
export async function createUser(uid: string, userData: Omit<User, "uid">) {
	await setDoc(doc(db, "users", uid), {
		...userData,
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	});
}

export async function getUser(uid: string) {
	const docSnap = await getDoc(doc(db, "users", uid));
	if (docSnap.exists()) {
		return { id: docSnap.id, ...docSnap.data() } as User & { id: string };
	}
	return null;
}

export async function updateUser(
	uid: string,
	updates: Partial<Omit<User, "uid">>,
) {
	await updateDoc(doc(db, "users", uid), {
		...updates,
		updatedAt: Timestamp.now(),
	});
}

// ========== Organizations ==========
export async function deleteOrganization(orgId: string) {
	const batch = writeBatch(db);

	// 1. Get all members to clean up their user documents
	const members = await getTeamMembers(orgId);
	for (const member of members) {
		if (member.userId && !member.userId.includes("@")) {
			const userRef = doc(db, "users", member.userId);
			batch.update(userRef, {
				organizationId: "",
				role: UserRole.VIEWER,
				permissions: [],
				updatedAt: Timestamp.now(),
			});
		}
	}

	// 2. Delete all members records
	for (const member of members) {
		const memberRef = doc(
			db,
			"organizations",
			orgId,
			"members",
			member.userId,
		);
		batch.delete(memberRef);
	}

	// 3. Delete the organization document itself
	const orgRef = doc(db, "organizations", orgId);
	batch.delete(orgRef);

	// 4. Commit everything
	await batch.commit();
}

export async function createOrganization(
	orgData: Omit<Organization, "id" | "createdAt" | "updatedAt">,
) {
	const orgRef = doc(collection(db, "organizations"));
	await setDoc(orgRef, {
		...orgData,
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	});
	return orgRef.id;
}

export async function getOrganization(orgId: string) {
	const docSnap = await getDoc(doc(db, "organizations", orgId));
	if (docSnap.exists()) {
		return { id: docSnap.id, ...docSnap.data() } as Organization & {
			id: string;
		};
	}
	return null;
}

export async function getUserOrganizations(userId: string) {
	const q = query(
		collection(db, "organizations"),
		where("createdById", "==", userId),
	);
	const querySnapshot = await getDocs(q);
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateOrganization(
	orgId: string,
	updates: Partial<Omit<Organization, "id" | "createdAt" | "updatedAt">>,
) {
	await updateDoc(doc(db, "organizations", orgId), {
		...updates,
		updatedAt: Timestamp.now(),
	});
}

// ========== Team Members ==========
export async function addTeamMember(
	organizationId: string,
	userId: string,
	role: UserRole,
	permissions: Permission[],
) {
	const memberRef = doc(
		db,
		"organizations",
		organizationId,
		"members",
		userId,
	);
	await setDoc(memberRef, {
		role,
		permissions,
		addedAt: Timestamp.now(),
	});
}

export async function getTeamMembers(organizationId: string) {
	const querySnapshot = await getDocs(
		collection(db, "organizations", organizationId, "members"),
	);
	return querySnapshot.docs.map((doc) => ({
		userId: doc.id,
		...doc.data(),
	}));
}

export async function updateTeamMemberPermissions(
	organizationId: string,
	userId: string,
	role: UserRole,
	permissions: Permission[],
) {
	const memberRef = doc(
		db,
		"organizations",
		organizationId,
		"members",
		userId,
	);
	await updateDoc(memberRef, { role, permissions });
}

export async function removeTeamMember(organizationId: string, userId: string) {
	// 1. Delete the member record from the organization's member list FIRST
	// This is the absolute critical path to revoke their dashboard access.
	const memberRef = doc(
		db,
		"organizations",
		organizationId,
		"members",
		userId,
	);
	await deleteDoc(memberRef);

	// 2. Attempt to clean up the user's personal profile document
	// We do this separately because Firestore rules for the 'users' collection
	// can be more restrictive than the organization's member list.
	if (userId && !userId.includes("@")) {
		try {
			const userRef = doc(db, "users", userId);
			await updateDoc(userRef, {
				organizationId: "",
				role: UserRole.VIEWER,
				permissions: [],
				updatedAt: Timestamp.now(),
			});
		} catch (e) {
			console.warn(
				"[removeTeamMember] Note: Organization membership was revoked, but user profile cleanup failed. This usually happens if security rules prevent an admin from editing another user's private document directly.",
				e,
			);
			// We do NOT throw here because the primary goal (revoking access) was successful.
		}
	}
}

export async function isMemberOfOrganization(
	organizationId: string,
	userId: string,
) {
	const memberRef = doc(
		db,
		"organizations",
		organizationId,
		"members",
		userId,
	);
	const docSnap = await getDoc(memberRef);
	return docSnap.exists();
}

// ========== Form Templates ==========
export async function createFormTemplate(
	organizationId: string,
	templateData: Omit<FormTemplate, "id" | "createdAt" | "updatedAt">,
) {
	const templateRef = doc(
		collection(db, "organizations", organizationId, "formTemplates"),
	);
	await setDoc(templateRef, {
		...templateData,
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	});
	return templateRef.id;
}

export async function getFormTemplates(organizationId: string) {
	const querySnapshot = await getDocs(
		query(
			collection(db, "organizations", organizationId, "formTemplates"),
			where("isActive", "==", true),
		),
	);

	const toMillis = (value: unknown) => {
		if (
			value &&
			typeof value === "object" &&
			"toMillis" in value &&
			typeof (value as any).toMillis === "function"
		) {
			return (value as any).toMillis();
		}
		if (value instanceof Date) return value.getTime();
		return 0;
	};

	const templates = querySnapshot.docs.map((docSnap) => ({
		id: docSnap.id,
		...docSnap.data(),
	})) as (FormTemplate & { id: string } & { createdAt?: unknown })[];

	templates.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
	return templates as (FormTemplate & { id: string })[];
}

export async function getFormTemplate(
	organizationId: string,
	templateId: string,
) {
	const docSnap = await getDoc(
		doc(db, "organizations", organizationId, "formTemplates", templateId),
	);
	if (docSnap.exists()) {
		return { id: docSnap.id, ...docSnap.data() } as FormTemplate & {
			id: string;
		};
	}
	return null;
}

export async function updateFormTemplate(
	organizationId: string,
	templateId: string,
	updates: Partial<Omit<FormTemplate, "id" | "createdAt" | "organizationId">>,
) {
	await updateDoc(
		doc(db, "organizations", organizationId, "formTemplates", templateId),
		{
			...updates,
			updatedAt: Timestamp.now(),
		},
	);
}

export async function deleteFormTemplate(
	organizationId: string,
	templateId: string,
) {
	await deleteDoc(
		doc(db, "organizations", organizationId, "formTemplates", templateId),
	);
}

// ========== Leads ==========
export async function createLead(
	organizationId: string,
	leadData: Omit<Lead, "id" | "createdAt" | "updatedAt">,
) {
	const leadRef = doc(
		collection(db, "organizations", organizationId, "leads"),
	);
	await setDoc(leadRef, {
		...leadData,
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now(),
	});
	return leadRef.id;
}

export async function getLead(organizationId: string, leadId: string) {
	const docSnap = await getDoc(
		doc(db, "organizations", organizationId, "leads", leadId),
	);
	if (docSnap.exists()) {
		return { id: docSnap.id, ...docSnap.data() } as Lead & { id: string };
	}
	return null;
}

export async function getLeads(
	organizationId: string,
	constraints: QueryConstraint[] = [],
): Promise<(Lead & { id: string })[]> {
	const q = query(
		collection(db, "organizations", organizationId, "leads"),
		...constraints,
	);
	const querySnapshot = await getDocs(q);
	return querySnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	})) as (Lead & { id: string })[];
}

export async function updateLead(
	organizationId: string,
	leadId: string,
	updates: Partial<
		Omit<Lead, "id" | "organizationId" | "createdAt" | "createdBy">
	>,
) {
	await updateDoc(doc(db, "organizations", organizationId, "leads", leadId), {
		...updates,
		updatedAt: Timestamp.now(),
	});
}

export async function deleteLead(organizationId: string, leadId: string) {
	await deleteDoc(doc(db, "organizations", organizationId, "leads", leadId));
}

export async function bulkUpdateLeads(
	organizationId: string,
	leadIds: string[],
	updates: Partial<
		Omit<Lead, "id" | "organizationId" | "createdAt" | "createdBy" | "data">
	>,
) {
	const batch = writeBatch(db);
	leadIds.forEach((leadId) => {
		const leadRef = doc(
			db,
			"organizations",
			organizationId,
			"leads",
			leadId,
		);
		batch.update(leadRef, {
			...updates,
			updatedAt: Timestamp.now(),
		});
	});
	await batch.commit();
}

// ========== Lead Activities (Audit Log) ==========
export async function createLeadActivity(
	organizationId: string,
	activityData: Omit<LeadActivity, "id" | "createdAt">,
) {
	const activityRef = doc(
		collection(db, "organizations", organizationId, "activities"),
	);
	await setDoc(activityRef, {
		...activityData,
		createdAt: Timestamp.now(),
	});
	return activityRef.id;
}

export async function getLeadActivities(
	organizationId: string,
	leadId: string,
) {
	const querySnapshot = await getDocs(
		query(
			collection(db, "organizations", organizationId, "activities"),
			where("leadId", "==", leadId),
		),
	);
	const activities = querySnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	})) as (LeadActivity & { id: string } & { createdAt?: any })[];

	activities.sort((a, b) => {
		const toMillis = (val: any) => {
			if (!val) return 0;
			if (val instanceof Date) return val.getTime();
			if (typeof val.toMillis === "function") return val.toMillis();
			if (val.seconds !== undefined) return val.seconds * 1000;
			const parsed = new Date(val);
			return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
		};
		return toMillis(b.createdAt) - toMillis(a.createdAt);
	});

	return activities as (LeadActivity & { id: string })[];
}

// ========== Utility Functions ==========
export function convertFirestoreTimestamp(timestamp: any): Date {
	if (timestamp instanceof Timestamp) {
		return timestamp.toDate();
	}
	return timestamp;
}

export function convertFirestoreData(data: any): any {
	if (!data) return data;
	if (data instanceof Timestamp) {
		return data.toDate();
	}
	if (Array.isArray(data)) {
		return data.map(convertFirestoreData);
	}
	if (typeof data === "object") {
		const converted: any = {};
		for (const key in data) {
			converted[key] = convertFirestoreData(data[key]);
		}
		return converted;
	}
	return data;
}
