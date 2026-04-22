import { authFetch } from '../api'
import type { Project, Room, TextBlock, PriceData, ListItem, User } from '../types/interface'
import type { WorkType } from '../types/constants'

export type RoomFormData = { room_type: string; work_types: WorkType[]; notes: string }

export async function fetchProjectAll(id: string): Promise<{ project: Project | null; items: ListItem[] }> {
    const [projRes, roomsRes, textRes] = await Promise.all([
        authFetch(`/projects`),
        authFetch(`/rooms?project_id=${id}`),
        authFetch(`/projects/${id}/text-blocks`),
    ])
    const projects: Project[] = await projRes.json()
    const rooms: Room[] = await roomsRes.json()
    const texts: TextBlock[] = await textRes.json()
    const project = projects.find(p => p.id === Number(id)) ?? null
    const items: ListItem[] = [
        ...rooms.map(r => ({ kind: 'room' as const, data: r })),
        ...texts.map(b => ({ kind: 'text' as const, data: b })),
    ].sort((a, b) => a.data.sort_order - b.data.sort_order)
    return { project, items }
}

export async function createRoom(projectId: number, data: RoomFormData): Promise<void> {
    await authFetch('/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, project_id: projectId }),
    })
}

export async function updateRoom(roomId: number, projectId: number, data: RoomFormData): Promise<void> {
    await authFetch(`/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, project_id: projectId }),
    })
}

export async function deleteRoom(roomId: number): Promise<void> {
    await authFetch(`/rooms/${roomId}`, { method: 'DELETE' })
}

export async function createTextBlock(projectId: number): Promise<void> {
    await authFetch(`/projects/${projectId}/text-blocks`, { method: 'POST' })
}

export async function updateTextBlock(projectId: number, blockId: number, content: string): Promise<void> {
    await authFetch(`/projects/${projectId}/text-blocks/${blockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    })
}

export async function deleteTextBlock(projectId: number, blockId: number): Promise<void> {
    await authFetch(`/projects/${projectId}/text-blocks/${blockId}`, { method: 'DELETE' })
}

export async function addPrice(roomId: number, data: PriceData): Promise<void> {
    await authFetch(`/rooms/${roomId}/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function updatePrice(roomId: number, priceId: number, data: PriceData): Promise<void> {
    await authFetch(`/rooms/${roomId}/prices/${priceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function deletePrice(roomId: number, priceId: number): Promise<void> {
    await authFetch(`/rooms/${roomId}/prices/${priceId}`, { method: 'DELETE' })
}

export async function reorderItems(projectId: number, items: Array<{ type: string; id: number }>): Promise<void> {
    await authFetch(`/projects/${projectId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    })
}

export async function fetchUsers(): Promise<User[]> {
    const res = await authFetch('/users')
    return res.json()
}
