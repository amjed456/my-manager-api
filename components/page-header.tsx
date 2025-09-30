"use client"

import { LogOut } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface PageHeaderProps {
  onSignOut: () => void;
  children?: ReactNode;
}

export default function PageHeader({ onSignOut, children }: PageHeaderProps) {
  return (
    <>
      {/* Header with logo and sign out button */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <Image 
            src="/placeholder-logo.svg" 
            alt="Project Manager Logo" 
            width={32} 
            height={32} 
            className="mr-2"
          />
        </div>
        <div className="flex gap-2">
          {children}
          <Button variant="outline" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  )
} 