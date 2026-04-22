import type { Project } from "../../types/interface"
import { UPLOADS_URL } from '../../api'

interface Props {
    project: Project | null
}

export default function ProjectMeta({ project }: Props) {
    if (!project) {
        return null; // or return <div>No project data</div>
    }

    return (
        <div className="project-meta">
            {project.image && (
                <img src={`${UPLOADS_URL}/${project.image}`} alt="" className="project-detail-image" />
            )}
            <div className="project-meta-fields">
                {project.address && <span>{project.address}</span>}
                {project.zip_code && <span>{project.zip_code}</span>}
                {project.city && <span>{project.city}</span>}
                {project.sqm_total != null && <span>{project.sqm_total} m²</span>}
            </div>
        </div>
    )
}


