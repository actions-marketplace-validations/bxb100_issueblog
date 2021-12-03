import {IIssue} from "../common/interface/issue";
import {IssuesUtil} from "./issue";
import {IComment} from "../common/interface/comment";
import * as core from "@actions/core";

// -----------------------------------------------------------------------------
/**
 * 格式如下:
 * 冒号为中文冒号 ：
 *
 * 名字：xxxxxx
 * 链接：xxxxxx
 * 描述：xxxxxx
 */
// -----------------------------------------------------------------------------

const FRIEND_TABLE_HEAD = 'Friends';
const FRIENDS_TABLE_TEMPLATE =
    (name: string, link: string, desc: string) => `| ${name} | ${link} | ${desc} |\n`
const FRIENDS_TABLE_TITLE = '## 友情链接\n'
const FRIENDS_TABLE_HEAD = "| Name | Link | Desc | \n | ---- | ---- | ---- |\n"

function _makeFriendTableString(comment: IComment): string {
    const dict: { [k: string]: string } = {}
    comment.body?.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.split('：'))
        .filter(s => s.length >= 2)
        .forEach(s => {
            dict[s[0]] = s[1]
        });
    core.debug(JSON.stringify(dict))
    return FRIENDS_TABLE_TEMPLATE(dict['名字'], dict['链接'], dict['描述']);
}

export async function add_md_friends(this: IssuesUtil, issues: IIssue[], result: string): Promise<string> {

    const friendIssues = issues.filter(issue => issue.labels.find(label => {
        if (typeof label === 'string') {
            return label === FRIEND_TABLE_HEAD;
        } else if (typeof label === 'object') {
            return label.name === FRIEND_TABLE_HEAD;
        }
        return false;
    }));

    const all: Promise<string[]>[] = []
    for (let issue of friendIssues) {
        all.push(this.getIssueComments(issue)
            .then(async comments => {
                const approved: IComment[] = []
                for (let comment of comments) {
                    if (await this.isHeartBySelf(comment)) {
                        approved.push(comment)
                    }
                }
                return approved
            })
            .then(approved =>
                approved.map(_makeFriendTableString)
            )
        );
    }
    const stringArray = await Promise.all(all);
    result += (`${FRIENDS_TABLE_TITLE}${FRIENDS_TABLE_HEAD}${stringArray.join('')}`);
    return result;
}