import { Redirect } from "expo-router";

export default function ProtectedIndexScreen() {
  return <Redirect href="/" />;
}
