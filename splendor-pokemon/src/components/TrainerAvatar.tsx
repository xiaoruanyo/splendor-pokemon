import { resolveAvatar } from '../data/trainers';
export default function TrainerAvatar({ avatar, size = 36 }: { avatar?: string; size?: number }) {
 return <img className="trainer-avatar" src={resolveAvatar(avatar)} alt="训练家头像" width={size} height={size} style={{ width: size, height: size }} />;
}
