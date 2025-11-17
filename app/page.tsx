import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Welcome to Bayanundur Admin</CardTitle>
          <CardDescription>
            Next.js application running on port 3030
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Your admin dashboard is ready to use!
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/admin">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

