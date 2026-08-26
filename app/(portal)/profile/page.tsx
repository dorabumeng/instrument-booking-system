import PageIntro from "@/components/PageIntro";
import ProfileForm from "@/components/ProfileForm";
import { getCurrentProfile } from "@/lib/auth/user";
import { notFound } from "next/navigation";
export default async function ProfilePage() { const profile = await getCurrentProfile(); if (!profile) notFound(); return <><PageIntro eyebrow="Account" title="Your profile" description="Keep your laboratory contact information current. Email and access role are protected fields." /><ProfileForm profile={profile} /></>; }
