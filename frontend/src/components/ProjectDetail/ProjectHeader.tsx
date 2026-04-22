import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { type Project } from '../../types/interface'


interface Props {
    project: Project | null
    isAdmin: boolean
    onAddRoom: () => void
    onAddTextBlock: () => void
}

export default function ProjectHeader({
    project,
    isAdmin,
    onAddRoom,
    onAddTextBlock,
}: Props) {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <header className="dashboard-header">
            <div className="detail-breadcrumb">
                <button
                    className="back-btn"
                    onClick={() => navigate('/dashboard/projects')}
                >
                    ← {t('projects.pageTitle')}
                </button>

                <span className="breadcrumb-sep">/</span>

                <h1 className="page-title">
                    {project?.name ?? '...'}
                </h1>
            </div>

            {isAdmin && (
                <div className="detail-actions">
                    <button
                        className="add-btn add-btn-secondary"
                        onClick={onAddTextBlock}
                    >
                        {t('rooms.addTextBlock')}
                    </button>

                    <button
                        className="add-btn"
                        onClick={onAddRoom}
                    >
                        {t('rooms.addRoom')}
                    </button>
                </div>
            )}
        </header>
    )
}