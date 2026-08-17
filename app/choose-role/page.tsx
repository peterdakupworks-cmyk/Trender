"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "../../components/Brand";
import { useAuth } from "../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { getAdvertiserProfile } from "../../lib/supabase/capabilities";

type CreatorStatus = { exists: boolean; identityStatus: string | null };
type Advert