import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { Task, TaskStore, TestGroup, TestCase, ImportJson, TestStatus } from './types'

export class StorageService {
  private storagePath: string
  private filePath: string

  constructor(extensionPath: string) {
    this.storagePath = path.join(extensionPath, '.testlists')
    this.filePath = path.join(this.storagePath, 'tasks.json')
    this.ensureStorage()
  }

  private ensureStorage(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true })
    }
    if (!fs.existsSync(this.filePath)) {
      this.saveAll({ version: 1, tasks: [] })
    }
  }

  loadAll(): TaskStore {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8')
      return JSON.parse(raw) as TaskStore
    } catch {
      return { version: 1, tasks: [] }
    }
  }

  saveAll(store: TaskStore): void {
    const tmpPath = this.filePath + '.tmp'
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf-8')
    fs.renameSync(tmpPath, this.filePath)
  }

  getAllTasks(): Task[] {
    return this.loadAll().tasks
  }

  getTask(taskId: string): Task | undefined {
    return this.loadAll().tasks.find((t) => t.taskId === taskId)
  }

  createTask(taskId: string, taskName: string): Task {
    const store = this.loadAll()
    const existing = store.tasks.find((t) => t.taskId === taskId)
    if (existing) {
      return existing
    }

    const now = new Date().toISOString()
    const task: Task = {
      taskId,
      taskName,
      createdAt: now,
      updatedAt: now,
      groups: [],
    }

    store.tasks.unshift(task)
    this.saveAll(store)
    return task
  }

  deleteTask(taskId: string): void {
    const store = this.loadAll()
    store.tasks = store.tasks.filter((t) => t.taskId !== taskId)
    this.saveAll(store)
  }

  updateTask(task: Task): void {
    const store = this.loadAll()
    const index = store.tasks.findIndex((t) => t.taskId === task.taskId)
    if (index >= 0) {
      task.updatedAt = new Date().toISOString()
      store.tasks[index] = task
      this.saveAll(store)
    }
  }

  addGroup(taskId: string, groupName: string): TestGroup | undefined {
    const task = this.getTask(taskId)
    if (!task) return undefined

    const group: TestGroup = {
      id: crypto.randomUUID(),
      name: groupName,
      tests: [],
    }

    task.groups.push(group)
    this.updateTask(task)
    return group
  }

  deleteGroup(taskId: string, groupId: string): void {
    const task = this.getTask(taskId)
    if (!task) return

    task.groups = task.groups.filter((g) => g.id !== groupId)
    this.updateTask(task)
  }

  addTest(taskId: string, groupId: string, description: string): TestCase | undefined {
    const task = this.getTask(taskId)
    if (!task) return undefined

    const group = task.groups.find((g) => g.id === groupId)
    if (!group) return undefined

    const test: TestCase = {
      id: crypto.randomUUID(),
      description,
      status: 'pending',
    }

    group.tests.push(test)
    this.updateTask(task)
    return test
  }

  deleteTest(taskId: string, groupId: string, testId: string): void {
    const task = this.getTask(taskId)
    if (!task) return

    const group = task.groups.find((g) => g.id === groupId)
    if (!group) return

    group.tests = group.tests.filter((t) => t.id !== testId)
    this.updateTask(task)
  }

  updateTestStatus(taskId: string, testId: string, status: TestStatus): void {
    const task = this.getTask(taskId)
    if (!task) return

    for (const group of task.groups) {
      const test = group.tests.find((t) => t.id === testId)
      if (test) {
        test.status = status
        this.updateTask(task)
        return
      }
    }
  }

  updateTestNotes(taskId: string, testId: string, notes: string): void {
    const task = this.getTask(taskId)
    if (!task) return

    for (const group of task.groups) {
      const test = group.tests.find((t) => t.id === testId)
      if (test) {
        test.notes = notes || undefined
        this.updateTask(task)
        return
      }
    }
  }

  /** Valida e importa JSON para uma tarefa (mode: 'replace' substitui, 'merge' adiciona) */
  importToTask(taskId: string, data: ImportJson, mode: 'replace' | 'merge'): Task | string {
    const validation = this.validateImport(data)
    if (validation) return validation

    const task = this.getTask(taskId)
    if (!task) return 'Tarefa não encontrada'

    const newGroups: TestGroup[] = data.groups.map((g) => ({
      id: crypto.randomUUID(),
      name: g.name,
      tests: g.tests.map((t) => ({
        id: crypto.randomUUID(),
        description: t.description,
        status: t.status || 'pending',
        notes: t.notes || undefined,
      })),
    }))

    if (mode === 'replace') {
      task.groups = newGroups
    } else {
      task.groups.push(...newGroups)
    }

    if (data.taskName) {
      task.taskName = data.taskName
    }

    this.updateTask(task)
    return task
  }

  private validateImport(data: ImportJson): string | null {
    if (!data || typeof data !== 'object') {
      return 'JSON inválido'
    }
    if (!Array.isArray(data.groups)) {
      return 'Campo "groups" deve ser um array'
    }
    for (let i = 0; i < data.groups.length; i++) {
      const group = data.groups[i]
      if (!group.name || typeof group.name !== 'string') {
        return `Grupo ${i + 1}: campo "name" obrigatório`
      }
      if (!Array.isArray(group.tests)) {
        return `Grupo "${group.name}": campo "tests" deve ser um array`
      }
      for (let j = 0; j < group.tests.length; j++) {
        const test = group.tests[j]
        if (!test.description || typeof test.description !== 'string') {
          return `Grupo "${group.name}", teste ${j + 1}: campo "description" obrigatório`
        }
      }
    }
    return null
  }

  /** Retorna estatísticas de progresso da tarefa */
  getTaskProgress(taskId: string): { passed: number; total: number } {
    const task = this.getTask(taskId)
    if (!task) return { passed: 0, total: 0 }

    let passed = 0
    let total = 0
    for (const group of task.groups) {
      for (const test of group.tests) {
        total++
        if (test.status === 'passed') passed++
      }
    }
    return { passed, total }
  }
}
