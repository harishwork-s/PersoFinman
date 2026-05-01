import { Alert } from "react-native";

export function confirmDelete(t, onConfirm) {
  Alert.alert(t.deleteItemTitle, t.deleteItemMessage, [
    { text: t.cancel, style: "cancel" },
    { text: t.delete, style: "destructive", onPress: onConfirm },
  ]);
}
