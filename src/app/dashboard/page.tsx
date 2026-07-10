import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/login/actions"
import { NewProjectForm } from "@/components/new-project-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function Dashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, plan_path, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SCE
          </Link>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/api"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            API keys
          </Link>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <NewProjectForm />

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {(projects ?? []).map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="transition-colors hover:border-foreground/30">
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <CardDescription>
                  {p.plan_path ? "Plan uploaded" : "No plan yet"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      {(!projects || projects.length === 0) && (
        <p className="mt-8 text-sm text-muted-foreground">
          No buildings yet. Create your first project above.
        </p>
      )}
    </div>
  )
}
