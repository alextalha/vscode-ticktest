export type TestStatus = 'pending' | 'passed' | 'failed' | 'skipped'

export interface TestCase {
  id: string
  description: string
  status: TestStatus
  notes?: string
}

export interface TestGroup {
  id: string
  name: string
  tests: TestCase[]
}

export interface Task {
  taskId: string
  taskName: string
  createdAt: string
  updatedAt: string
  groups: TestGroup[]
}

export interface TaskStore {
  version: 1
  tasks: Task[]
}

/** Formato aceito na importação (sem IDs/datas — gerados automaticamente) */
export interface ImportJson {
  taskId?: string
  taskName?: string
  groups: Array<{
    name: string
    tests: Array<{
      description: string
      status?: TestStatus
      notes?: string
    }>
  }>
}
