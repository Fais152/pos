import * as React from 'react';
import { cn } from '../../lib/utils';

const Separator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn('w-full border-t border-border', className)}
    {...props}
  />
));
Separator.displayName = 'Separator';

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('rounded-md bg-muted', className)}
    {...props}
  />
);
Skeleton.displayName = 'Skeleton';

export { Separator, Skeleton };