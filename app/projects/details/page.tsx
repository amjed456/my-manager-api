"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import ProjectDetailsClient from "@/components/project-details-client"

function ProjectDetailsContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')
  
  // Add validation to ensure we have a valid ID
  if (!projectId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 font-medium">Invalid project ID</p>
          <a href="/projects" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-md">
            Back to Projects
          </a>
        </div>
      </div>
    )
  }
  
  return <ProjectDetailsClient projectId={projectId} />
}

export default function ProjectDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    }>
      <ProjectDetailsContent />
    </Suspense>
  )
} 