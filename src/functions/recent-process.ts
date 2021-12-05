import {GithubKit} from '../common/clazz/github-kit'
import {Issue} from '../common/clazz/issue'
import {Config} from "../util/config";

export const RECENT_ISSUE_TITLE = (config: Config) => `\n## ${config.recent_title}\n`

export async function add_md_recent(
    this: GithubKit<string>,
    issues: Issue[]
): Promise<void> {
    let limit = parseInt(this.config.recent_limit)

    const recentIssues = issues.slice(0, limit)

    this.result += RECENT_ISSUE_TITLE(this.config)
    this.result += recentIssues.map(i => i.mdIssueInfo()).join('')
}
