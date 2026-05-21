import { motion, AnimatePresence } from 'framer-motion';

import {
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { PROCESSING_STAGES } from '@/types/document';

import type {
  ProcessingStageId,
  StageStatus,
} from '@/types/document';

interface ProcessingTimelineProps {
  stages: Record<ProcessingStageId, StageStatus>;

  currentStage: ProcessingStageId | null;

  progress?: number;

  currentMessage?: string;

  error?: string | null;
}

export function ProcessingTimeline({
  stages,
  currentStage,
  progress,
  currentMessage,
  error,
}: ProcessingTimelineProps) {

  return (
    <div className="w-full max-w-2xl space-y-3">

      {/* ================================================= */}
      {/* GLOBAL PROGRESS */}
      {/* ================================================= */}

      {typeof progress === 'number' && (

        <div className="space-y-2 mb-6">

          <div className="flex items-center justify-between text-sm">

            <span className="text-muted-foreground">
              Processing Progress
            </span>

            <span className="font-medium text-primary">
              {progress}%
            </span>

          </div>

          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{
                duration: 0.4,
              }}
              className="h-full bg-primary rounded-full"
            />

          </div>

          {currentMessage && (

            <p className="text-xs text-muted-foreground">
              {currentMessage}
            </p>

          )}

        </div>
      )}

      {/* ================================================= */}
      {/* STAGES */}
      {/* ================================================= */}

      {PROCESSING_STAGES.map((stage) => {

        // ================================================
        // SAFE STATUS ACCESS
        // ================================================

        const status =
          stages?.[stage.id] || 'pending';

        // ================================================
        // ACTIVE STAGE
        // ================================================

        const isActive =
          currentStage === stage.id &&
          status !== 'done' &&
          status !== 'error';

        // ================================================
        // COLORS
        // ================================================

        const containerClass =
          isActive
            ? 'border-primary/40 bg-primary/5'
            : status === 'done'
            ? 'border-green-500/30 bg-green-500/5'
            : status === 'error'
            ? 'border-destructive/40 bg-destructive/5'
            : 'border-border bg-transparent';

        return (
          <motion.div
            key={stage.id}
            initial={{
              opacity: 0,
              y: 12,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
            layout
            className={`relative overflow-hidden flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all duration-300 ${containerClass}`}
          >
            {isActive && (
              <motion.div
                className="absolute left-0 top-0 h-full w-1 bg-primary/70"
                initial={{ opacity: 0, scaleY: 0.2 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            )}

            {/* ========================================= */}
            {/* ICON */}
            {/* ========================================= */}

            <AnimatePresence mode="wait">

              {status === 'done' ? (

                <motion.div
                  key="done"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                </motion.div>

              ) : status === 'error' ? (

                <motion.div
                  key="error"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                >
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                </motion.div>

              ) : isActive ? (

                <motion.div
                  key="active"
                  initial={{ scale: 0.8, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.8 }}
                >
                  <Loader2 className="h-5 w-5 text-primary shrink-0 animate-spin" />
                </motion.div>

              ) : (

                <motion.div
                  key="pending"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="h-5 w-5 rounded-full border-2 border-border shrink-0"
                />

              )}

            </AnimatePresence>

            {/* ========================================= */}
            {/* LABELS */}
            {/* ========================================= */}

            <div className="min-w-0 flex-1">

              <p
                className={`text-sm font-medium ${
                  isActive
                    ? 'text-primary'
                    : status === 'done'
                    ? 'text-green-500'
                    : status === 'error'
                    ? 'text-destructive'
                    : 'text-foreground'
                }`}
              >
                {stage.label}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {stage.sublabel}
              </p>

            </div>

            {/* ========================================= */}
            {/* STATUS TEXT */}
            {/* ========================================= */}

            <div className="ml-auto">

              {status === 'done' ? (

                <span className="text-xs text-green-500 font-medium">
                  Completed
                </span>

              ) : status === 'error' ? (

                <span className="text-xs text-destructive font-medium">
                  Failed
                </span>

              ) : isActive ? (

                <span className="text-xs text-primary font-medium animate-pulse">
                  Processing
                </span>

              ) : (

                <span className="text-xs text-muted-foreground">
                  Waiting
                </span>

              )}

            </div>

          </motion.div>
        );
      })}

      {/* ================================================= */}
      {/* GLOBAL ERROR */}
      {/* ================================================= */}

      {error && (

        <motion.div
          initial={{
            opacity: 0,
            y: 5,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="text-sm text-destructive mt-3 flex items-center gap-2"
        >

          <AlertCircle className="h-4 w-4 shrink-0" />

          <span>{error}</span>

        </motion.div>
      )}

    </div>
  );
}