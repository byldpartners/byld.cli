#!/usr/bin/env bash
# Create .env file from GitHub secrets JSON
# Usage: create-env.sh '{"KEY": "value", "KEY2": "value2"}'

json_secrets_str=$1
env_filename=".env"
jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' <<< "$json_secrets_str" > "$env_filename"
