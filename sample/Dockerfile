FROM python:3.13

ENV PIPENV_VENV_IN_PROJECT 1
ENV PATH "/workspace/.venv/bin:$PATH"

WORKDIR /workspace

RUN \
  --mount=type=cache,target=/root/.cache \
  --mount=type=bind,source=Pipfile,target=Pipfile \
  --mount=type=bind,source=Pipfile.lock,target=Pipfile.lock \
  pip install --upgrade pip \
  && pip install pipenv \
  && pipenv sync --dev
