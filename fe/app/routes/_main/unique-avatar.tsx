import classes from "./styles.module.css"

type UniqueAvatarProps = {
  name: string
  color: string
  image_link?: string
}

export function UniqueAvatar({ name, color, image_link }: UniqueAvatarProps) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div
      className="avatar"
      style={{
        backgroundColor: image_link ? "transparent" : color,
        backgroundImage: image_link ? `url(${image_link})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <span className="avatar-initial">{initial}</span>
    </div>
  )
}
