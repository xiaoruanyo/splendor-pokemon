export default function TrainerAvatar({ avatar }: { avatar?: string }) {
  return avatar?.startsWith('/assets/trainers/')
    ? <img className="trainer-avatar" src={avatar} alt="训练家头像" />
    : <span>{avatar || '🎒'}</span>;
}
