import { BadgeCls, BadgeInfo } from '../../types/archive'

const CURRENT_YEAR = new Date().getFullYear()

export function getBadgeInfo(anio: string | number): BadgeInfo {
  const age = CURRENT_YEAR - Number(anio)
  if (age >= 10) return { cls: 'due', txt: 'Cumplió 10 años · evaluar baja' }
  if (age >= 8)  return { cls: 'warn', txt: `Vence en ${10 - age} año(s)` }
  return { cls: 'ok', txt: 'Vigente' }
}

interface BadgeProps {
  cls: BadgeCls
  txt: string
}

export default function Badge({ cls, txt }: BadgeProps) {
  let colors = ''
  if (cls === 'ok') colors = 'bg-[#516B47]/15 text-arc-olive'
  if (cls === 'warn') colors = 'bg-[#AD8A50]/20 text-[#7A5F2C]'
  if (cls === 'due') colors = 'bg-[#A13328]/15 text-arc-redDark'

  return (
    <span className={`text-[11px] px-[7px] py-[2px] rounded-full font-semibold whitespace-nowrap ${colors}`}>
      {txt}
    </span>
  )
}
