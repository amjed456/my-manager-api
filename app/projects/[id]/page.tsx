import ProjectDetailsClient from "@/components/project-details-client"

// Generate static params for build time
export function generateStaticParams() {
  // Include at least one dummy ID for static export
  return [
    { id: "placeholder" },
    { id: "demo-project" },
    { id: "sample-project" }
  ]
}

// Server component that passes params to client component
export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params as required by Next.js 15
  const { id } = await params
  
  console.log("Server component project ID:", id)
  
  // Add validation to ensure we have a valid ID
  if (!id) {
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
  
  // Pass the extracted ID directly instead of the params object
  return <ProjectDetailsClient projectId={id} />
}
