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
	await deleteDoc(
		doc(db, "organizations", organizationId, "members", userId),
	);
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
			orderBy("createdAt", "desc"),
		),
	);
	return querySnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	})) as (LeadActivity & { id: string })[];
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
