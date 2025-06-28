"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"
import { taskService } from "@/services"
import { Task } from "@/services/taskService"
import { toast } from "sonner"

interface TaskListProps {
  projectId: string
  onProgressChange: (progress: number) => void
}

export default function TaskList({ projectId, onProgressChange }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskName, setNewTaskName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tasks for the project
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const fetchedTasks = await taskService.getTasksByProject(projectId)
        setTasks(fetchedTasks)
        
        // Calculate initial progress
        if (fetchedTasks.length > 0) {
          const completedCount = fetchedTasks.filter(t => t.status === "Done").length
          const progressPercentage = Math.round((completedCount / fetchedTasks.length) * 100)
          onProgressChange(progressPercentage)
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
        toast.error('Failed to load tasks')
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchTasks()
    }
  }, [projectId, onProgressChange])

  const toggleTask = async (taskId: string) => {
    try {
      const taskToUpdate = tasks.find(t => t._id === taskId)
      if (!taskToUpdate) return

      const newStatus = taskToUpdate.status === "Done" ? "To Do" : "Done"
      
      const updatedTask = await taskService.updateTask(taskId, {
        status: newStatus
      })
      
      const updatedTasks = tasks.map(task => 
        task._id === taskId ? updatedTask : task
      )
      
    setTasks(updatedTasks)

    // Calculate and update progress
      const completedCount = updatedTasks.filter(t => t.status === "Done").length
    const progressPercentage = Math.round((completedCount / updatedTasks.length) * 100)
    onProgressChange(progressPercentage)
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to update task')
    }
  }

  const addTask = async () => {
    if (newTaskName.trim() === "") return

    try {
      const newTask = await taskService.createTask({
        title: newTaskName,
        projectId,
        status: "To Do",
        priority: "Medium"
      })

    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)
    setNewTaskName("")

    // Recalculate progress
      const completedCount = updatedTasks.filter(t => t.status === "Done").length
    const progressPercentage = Math.round((completedCount / updatedTasks.length) * 100)
    onProgressChange(progressPercentage)
      
      toast.success('Task added successfully')
    } catch (error) {
      console.error('Failed to create task:', error)
      toast.error('Failed to add task')
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading tasks...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Add a new task"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask()
          }}
        />
        <Button size="icon" onClick={addTask}>
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No tasks yet. Add your first task above.</div>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className="flex items-center space-x-2 p-3 rounded-md border">
              <Checkbox 
                id={`task-${task._id}`} 
                checked={task.status === "Done"} 
                onCheckedChange={() => toggleTask(task._id)} 
              />
            <label
                htmlFor={`task-${task._id}`}
                className={`flex-1 text-sm ${task.status === "Done" ? "line-through text-muted-foreground" : ""}`}
            >
                {task.title}
            </label>
          </div>
          ))
        )}
      </div>
    </div>
  )
}
