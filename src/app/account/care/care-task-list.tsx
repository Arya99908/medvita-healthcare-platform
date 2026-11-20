import Link from "next/link";
import { CalendarClock, ClipboardList } from "lucide-react";
import LocalDateTime from "@/components/local-date-time";
import { CareTaskStatusForm } from "../patients/care-task-form";

export type CareDashboardTask = {
  id: string;
  patient_id: string;
  title: string;
  due_at: string | null;
  status: string;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  patient_name: string;
};

export default function CareTaskList({ tasks, currentUserId, selectedStatus, now }: { tasks: CareDashboardTask[]; currentUserId: string; selectedStatus: string; now: number }) {
  const selectedTasks = tasks.filter((task) => selectedStatus === "all" || task.status === selectedStatus);
  if (!selectedTasks.length) return <div className="account-empty-state"><ClipboardList size={22} /><strong>{tasks.length ? "No tasks in this view" : "No tasks assigned to you"}</strong><span>{tasks.length ? "Choose another task status to see more." : "Tasks assigned to your account across readable profiles will appear here."}</span></div>;

  return <div className="care-dashboard-task-list">{selectedTasks.map((task) => {
    const canMarkMissed = task.status === "open" && Boolean(task.due_at && Date.parse(task.due_at) <= now);
    const statusLabel = task.status === "complete" ? "Complete" : task.status === "missed" ? "Missed" : canMarkMissed ? "Overdue" : "Open";
    return <article key={task.id} className={`care-dashboard-task ${task.status}`}>
      <div className="care-dashboard-task-top"><span className={`care-dashboard-status ${task.status === "missed" ? "missed" : canMarkMissed ? "overdue" : task.status}`}>{statusLabel}</span>{task.due_at ? <span className="care-dashboard-due"><CalendarClock size={14} /><LocalDateTime value={task.due_at} /></span> : <span className="care-dashboard-due">No due time</span>}</div>
      <h3>{task.title}</h3>
      {task.notes && <p>{task.notes}</p>}
      <div className="care-dashboard-task-bottom"><Link href={`/account/patients/${task.patient_id}`} className="account-record-link">{task.patient_name} · Open profile</Link><CareTaskStatusForm patientId={task.patient_id} taskId={task.id} status={task.status} assignedTo={task.assigned_to} createdBy={task.created_by} currentUserId={currentUserId} canMarkMissed={canMarkMissed} /></div>
    </article>;
  })}</div>;
}
