"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ApartmentDetailsClient from "@/components/apartment-details-client"

function ApartmentDetailsContent() {
  const searchParams = useSearchParams()
  const apartmentId = searchParams.get('id')

  if (!apartmentId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center py-12">
          <p className="text-red-500">Invalid apartment ID</p>
        </div>
      </div>
    )
  }

  return <ApartmentDetailsClient apartmentId={apartmentId} />
}

export default function ApartmentDetailsPage() {
  return (
    <Suspense fallback={<div>Loading apartment details...</div>}>
      <ApartmentDetailsContent />
    </Suspense>
  )
} 