ARG ACTION_REF=v1
FROM ghcr.io/starburst997/deployment-actions:${ACTION_REF}

# This is just a passthrough - all the real work is done in the base image
# The entrypoints are already defined in the base image

# This is because Github Action have no way of specifying a dynamic version for the image
# and I absolutely HATE bot commits, so this workaround should do the trick and still be fast.