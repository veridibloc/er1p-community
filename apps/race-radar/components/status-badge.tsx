import {CheckCircle2, XCircle, ClockIcon, CircleDotDashedIcon} from "lucide-react"

interface StatusBadgeProps {
    isFinished: boolean
    isDisqualified: boolean
    didNotFinish: boolean
}

export function StatusBadge({isFinished, isDisqualified, didNotFinish}: StatusBadgeProps) {
    if (isDisqualified) {
        return (
            <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-semibold">
                <XCircle className="h-3 w-3"/>
                DQ
            </div>
        )
    }

    if (isFinished) {
        return (
            <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10 text-success text-xs font-semibold">
                <CheckCircle2 className="h-3 w-3"/>
                Finished
            </div>
        )
    }

    if(didNotFinish) {
        return (
            <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-semibold">
                <CircleDotDashedIcon className="h-3 w-3"/>
                DNF
            </div>
        )
    }
    return (
        <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-semibold">
            <ClockIcon className="h-3 w-3"/>
            Racing
        </div>
    )
}
