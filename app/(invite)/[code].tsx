import { useLocalSearchParams } from "expo-router";

import { AcceptInviteScreen } from "@/features/invite/screens/AcceptInviteScreen";

export default function AcceptInviteWithCodeRoute() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const routeCode = Array.isArray(params.code) ? params.code[0] : params.code;

  return <AcceptInviteScreen initialCode={routeCode ?? ""} />;
}
