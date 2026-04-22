import type { WorkType } from './constants'

export interface Price {
    id: number
    room_id: number
    work_type: string
    hours: number
    rate: number
    include_vat: boolean
}

export interface Room {
    id: number
    project_id: number
    room_type: string
    work_types: WorkType[]
    notes: string | null
    sort_order: number
    prices: Price[]
}

export interface TextBlock {
    id: number
    project_id: number
    content: string
    sort_order: number
}

export interface Project {
    id: number
    name: string
    address: string | null
    zip_code: string | null
    city: string | null
    sqm_total: number | null
    image: string | null
}

export type PriceData = { work_type: string; hours: number; rate: number; include_vat: boolean }

export type ListItem = { kind: 'room'; data: Room } | { kind: 'text'; data: TextBlock }

export type RoomFormData = { room_type: string; work_types: WorkType[]; notes: string }

export const EmptyRoomForm = { room_type: 'rum', work_types: [] as WorkType[], notes: '' }

