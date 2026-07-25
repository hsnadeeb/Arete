import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

const USER_KEY = "arete_auth_user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "apple" | "email";
}

GoogleSignin.configure({
  webClientId: "795160464911-c292id4jvmkmljutj73t6ptu4r3eb956.apps.googleusercontent.com",
  iosClientId: "795160464911-glrv470pjevrk8chm50jok8bhq7v8qjn.apps.googleusercontent.com",
  offlineAccess: false,
});

export async function signInWithGoogle(): Promise<{
  user: AuthUser | null;
  error?: string;
}> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    if (signInResult.type !== "success") {
      return { user: null, error: "Sign in was cancelled" };
    }

    const { user: googleUser } = signInResult.data;

    const user: AuthUser = {
      id: googleUser.id,
      name: googleUser.name ?? googleUser.givenName ?? "Google User",
      email: googleUser.email,
      avatar: googleUser.photo ?? undefined,
      provider: "google",
    };

    await persistAuth(user);
    return { user };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { user: null, error: "Sign in was cancelled" };
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return { user: null, error: "Sign in already in progress" };
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { user: null, error: "Google Play Services not available" };
    }
    return { user: null, error: error.message || "Google sign-in failed" };
  }
}

export async function signInWithApple(): Promise<{
  user: AuthUser | null;
  error?: string;
}> {
  if (Platform.OS !== "ios") {
    return { user: null, error: "Apple Sign-In is only available on iOS" };
  }
  try {
    const Apple = require("expo-apple-authentication");
    const credential = await Apple.signInAsync({
      requestedScopes: [
        Apple.AppleAuthenticationScope.FULL_NAME,
        Apple.AppleAuthenticationScope.EMAIL,
      ],
    });

    const user: AuthUser = {
      id: credential.user,
      name:
        credential.fullName?.givenName
          ? `${credential.fullName.givenName} ${credential.fullName.familyName ?? ""}`.trim()
          : "Apple User",
      email: credential.email || `${credential.user}@privaterelay.appleid.com`,
      provider: "apple",
    };

    await persistAuth(user);
    return { user };
  } catch (error: any) {
    return { user: null, error: error?.message || "Apple sign-in failed" };
  }
}

export async function signInWithEmail(
  _email: string,
  _password: string,
): Promise<AuthUser | null> {
  return null;
}

export async function signUpWithEmail(
  _name: string,
  _email: string,
  _password: string,
): Promise<AuthUser | null> {
  return null;
}

async function persistAuth(user: AuthUser) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function restoreAuth(): Promise<{ user: AuthUser | null }> {
  try {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    if (userStr) {
      return { user: JSON.parse(userStr) as AuthUser };
    }
    return { user: null };
  } catch {
    return { user: null };
  }
}

export async function signOut() {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch {}
  await AsyncStorage.removeItem(USER_KEY);
}
