import WidgetKit
import SwiftUI
import AppIntents

// MARK: - App Intents for Direct Home-Screen Manipulation

struct ToggleTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Taskify Objective"
    static var description = IntentDescription("Directly toggle or complete an objective from the home-screen widget.")

    @Parameter(title: "Task ID")
    var taskId: String

    init() {}
    init(taskId: String) {
        self.taskId = taskId
    }

    func perform() async throws -> some IntentResult {
        // App Groups shared user defaults update
        if let sharedDefaults = UserDefaults(suiteName: "group.com.taskify.app") {
            var toggledIds = sharedDefaults.stringArray(forKey: "pending_toggled_task_ids") ?? []
            toggledIds.append(taskId)
            sharedDefaults.set(toggledIds, forKey: "pending_toggled_task_ids")
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

struct LogHabitIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Daily Routine"
    static var description = IntentDescription("Log completion or increment daily habit routine from the home-screen widget.")

    @Parameter(title: "Habit ID")
    var habitId: String

    init() {}
    init(habitId: String) {
        self.habitId = habitId
    }

    func perform() async throws -> some IntentResult {
        if let sharedDefaults = UserDefaults(suiteName: "group.com.taskify.app") {
            var loggedIds = sharedDefaults.stringArray(forKey: "pending_logged_habit_ids") ?? []
            loggedIds.append(habitId)
            sharedDefaults.set(loggedIds, forKey: "pending_logged_habit_ids")
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// MARK: - Widget Timeline & Data Model

struct TaskifyWidgetEntry: TimelineEntry {
    let date: Date
    let userName: String
    let pendingTasksCount: Int
    let pendingHabitsCount: Int
    let taskTitle1: String
    let taskCategory1: String
    let taskId1: String?
    let taskDone1: Bool
    let taskTitle2: String
    let taskId2: String?
    let taskDone2: Bool
    let habitName: String
    let habitProgress: String
    let habitId: String?
    let habitDone: Bool
}

struct TaskifyWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> TaskifyWidgetEntry {
        TaskifyWidgetEntry(
            date: Date(),
            userName: "Alex",
            pendingTasksCount: 2,
            pendingHabitsCount: 1,
            taskTitle1: "Prepare client roadmap",
            taskCategory1: "Work",
            taskId1: "t1",
            taskDone1: false,
            taskTitle2: "Inspect grocery expenses",
            taskId2: "t2",
            taskDone2: false,
            habitName: "Deep Focus Session",
            habitProgress: "1/2 sessions",
            habitId: "h1",
            habitDone: false
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (TaskifyWidgetEntry) -> Void) {
        completion(readSharedEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TaskifyWidgetEntry>) -> Void) {
        let entry = readSharedEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func readSharedEntry() -> TaskifyWidgetEntry {
        let defaults = UserDefaults(suiteName: "group.com.taskify.app")
        let userName = defaults?.string(forKey: "userName") ?? "Alex"
        let pendingTasks = defaults?.integer(forKey: "pendingTasksCount") ?? 0
        let pendingHabits = defaults?.integer(forKey: "pendingHabitsCount") ?? 0

        return TaskifyWidgetEntry(
            date: Date(),
            userName: userName,
            pendingTasksCount: pendingTasks,
            pendingHabitsCount: pendingHabits,
            taskTitle1: defaults?.string(forKey: "task_0_title") ?? "No pending objectives",
            taskCategory1: defaults?.string(forKey: "task_0_category") ?? "Focus",
            taskId1: defaults?.string(forKey: "task_0_id"),
            taskDone1: defaults?.bool(forKey: "task_0_done") ?? false,
            taskTitle2: defaults?.string(forKey: "task_1_title") ?? "All clear",
            taskId2: defaults?.string(forKey: "task_1_id"),
            taskDone2: defaults?.bool(forKey: "task_1_done") ?? false,
            habitName: defaults?.string(forKey: "habit_0_name") ?? "Daily Routine",
            habitProgress: defaults?.string(forKey: "habit_0_progress") ?? "0/1",
            habitId: defaults?.string(forKey: "habit_0_id"),
            habitDone: defaults?.bool(forKey: "habit_0_done") ?? false
        )
    }
}

// MARK: - Apple Design Glassmorphic Widget View

struct TaskifyWidgetView: View {
    var entry: TaskifyWidgetEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header Bar
            HStack(alignment: .center) {
                HStack(spacing: 6) {
                    Circle()
                        .fill(Color(red: 0.95, green: 0.42, blue: 0.21))
                        .frame(width: 8, height: 8)
                    Text("Taskify")
                        .font(.system(size: 13, weight: .black, design: .default))
                        .tracking(-0.3)
                        .foregroundColor(.white)
                }

                Spacer()

                Text("\(entry.pendingTasksCount) left • \(entry.pendingHabitsCount) rut")
                    .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                    .foregroundColor(Color.white.opacity(0.8))
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(Color.white.opacity(0.08))
                    .clipShape(Capsule())
            }

            Divider()
                .background(Color.white.opacity(0.08))

            // Body Split Columns: Left Focus Tasks, Right Active Routine
            HStack(alignment: .top, spacing: 14) {
                // Column 1: Objectives
                VStack(alignment: .leading, spacing: 8) {
                    Text("TODAY'S FOCUS")
                        .font(.system(size: 9, weight: .bold))
                        .tracking(0.5)
                        .foregroundColor(Color.white.opacity(0.45))

                    // Task 1
                    if let id = entry.taskId1 {
                        Button(intent: ToggleTaskIntent(taskId: id)) {
                            HStack(spacing: 7) {
                                Image(systemName: entry.taskDone1 ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(entry.taskDone1 ? Color.green : Color.white.opacity(0.4))
                                Text(entry.taskTitle1)
                                    .font(.system(size: 11, weight: .medium))
                                    .lineLimit(1)
                                    .strikethrough(entry.taskDone1)
                                    .foregroundColor(entry.taskDone1 ? Color.white.opacity(0.4) : .white)
                            }
                        }
                        .buttonStyle(.plain)
                    }

                    // Task 2
                    if let id = entry.taskId2 {
                        Button(intent: ToggleTaskIntent(taskId: id)) {
                            HStack(spacing: 7) {
                                Image(systemName: entry.taskDone2 ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(entry.taskDone2 ? Color.green : Color.white.opacity(0.4))
                                Text(entry.taskTitle2)
                                    .font(.system(size: 11, weight: .medium))
                                    .lineLimit(1)
                                    .strikethrough(entry.taskDone2)
                                    .foregroundColor(entry.taskDone2 ? Color.white.opacity(0.4) : .white)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Column 2: Active Routine
                VStack(alignment: .leading, spacing: 6) {
                    Text("ROUTINE")
                        .font(.system(size: 9, weight: .bold))
                        .tracking(0.5)
                        .foregroundColor(Color.white.opacity(0.45))

                    if let id = entry.habitId {
                        Button(intent: LogHabitIntent(habitId: id)) {
                            VStack(alignment: .leading, spacing: 3) {
                                HStack {
                                    Text(entry.habitName)
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(.white)
                                        .lineLimit(1)
                                    Spacer()
                                    Image(systemName: "plus.circle.fill")
                                        .font(.system(size: 12))
                                        .foregroundColor(Color(red: 0.95, green: 0.42, blue: 0.21))
                                }
                                Text(entry.habitProgress)
                                    .font(.system(size: 9, weight: .semibold, design: .monospaced))
                                    .foregroundColor(Color.white.opacity(0.6))
                            }
                            .padding(8)
                            .background(Color.white.opacity(0.06))
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .frame(width: 120)
            }
        }
        .padding(14)
        .containerBackground(for: .widget) {
            Color(red: 0.09, green: 0.08, blue: 0.07).opacity(0.92)
        }
    }
}

@main
struct TaskifyWidget: Widget {
    let kind: String = "TaskifyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TaskifyWidgetProvider()) { entry in
            TaskifyWidgetView(entry: entry)
        }
        .configurationDisplayName("Taskify Glass Widget")
        .description("Log routines and check off objectives with direct Apple manipulation.")
        .supportedFamilies([.systemMedium])
    }
}
