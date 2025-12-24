import { auth } from "./auth";

// Server-side helper to get session
export async function getSession() {
    return await auth();
}

// Server-side helper to get user
export async function getCurrentUser() {
    const session = await auth();
    return session?.user;
}
