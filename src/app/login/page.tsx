"use client"

import { useActionState } from "react"
import { signIn, signUp, type AuthState } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const initial: AuthState = {}

export default function LoginPage() {
  const [signInState, signInAction, signingIn] = useActionState(signIn, initial)
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, initial)
  const error = signInState.error ?? signUpState.error
  const message = signUpState.message

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Spatial Context Engine</CardTitle>
          <CardDescription>Sign in or create an account to build your spatial graph.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} autoComplete="current-password" />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <div className="flex gap-2">
              <Button type="submit" formAction={signInAction} disabled={signingIn} className="flex-1">
                {signingIn ? "Signing in…" : "Sign in"}
              </Button>
              <Button type="submit" formAction={signUpAction} disabled={signingUp} variant="outline" className="flex-1">
                {signingUp ? "Creating…" : "Sign up"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
