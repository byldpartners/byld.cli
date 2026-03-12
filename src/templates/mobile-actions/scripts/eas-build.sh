#!/usr/bin/env bash

cd ./apps/mobile

if [ "$PROFILE" == 'production' ] && [ "$SHOULD_SUBMIT" == 'yes' ];
then
  eas build --profile "$PROFILE" --platform "$PLATFORM" --auto-submit --non-interactive --no-wait
else
  eas build --profile "$PROFILE" --platform "$PLATFORM" --non-interactive --no-wait
fi
