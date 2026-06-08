#!/usr/bin/env bash

urlencode() {
  python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

build_cloudsql_database_url() {
  local user="$1"
  local password="$2"
  local db_name="$3"
  local connection_name="$4"
  local enc_pass enc_host
  enc_pass="$(urlencode "${password}")"
  enc_host="$(urlencode "/cloudsql/${connection_name}")"
  printf 'postgresql://%s:%s@localhost/%s?host=%s' "${user}" "${enc_pass}" "${db_name}" "${enc_host}"
}

build_local_database_url() {
  local user="$1"
  local password="$2"
  local db_name="$3"
  local port="${4:-5432}"
  local enc_pass
  enc_pass="$(urlencode "${password}")"
  printf 'postgresql://%s:%s@127.0.0.1:%s/%s' "${user}" "${enc_pass}" "${port}" "${db_name}"
}
