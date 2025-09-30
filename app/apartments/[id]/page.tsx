import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Building, Clock } from "lucide-react"
import { format } from "date-fns"
import ApartmentDetailsClient from "@/components/apartment-details-client"
import ProgressList from "@/components/progress-list"
import SiteNotesList from "@/components/site-notes-list"
import FieldInstructionsList from "@/components/field-instructions-list"

interface ApartmentDetailsPageProps {
  params: Promise<{ id: string }>
}

// Generate static params for build time - include common patterns
export function generateStaticParams() {
  // Include dummy IDs for static export, but avoid 'details' to prevent conflicts
  return [
    { id: "placeholder" },
    { id: "demo-apartment" },
    { id: "sample-apartment" },
    { id: "static-apartment" }
  ]
}

export default async function ApartmentDetailsPage({ params }: ApartmentDetailsPageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  // For static export, we'll let the client component handle the actual ID
  // This allows any apartment ID to work, not just the pre-generated ones
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Suspense fallback={<div>Loading apartment details...</div>}>
        <ApartmentDetailsClient apartmentId={id} />
      </Suspense>

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Project Progress</TabsTrigger>
          <TabsTrigger value="notes">Site Notes</TabsTrigger>
          <TabsTrigger value="instructions">Field Instructions</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <ProgressList apartmentId={id} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <SiteNotesList apartmentId={id} />
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          <FieldInstructionsList apartmentId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 