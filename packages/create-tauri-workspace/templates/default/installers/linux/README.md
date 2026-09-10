# Linux distribution

The release workflow builds an AppImage and a Debian package. The AppImage is
also the updater artifact: automatic updates on Linux replace it.

## Which runner builds it, and why it matters

The workflow builds on `ubuntu-24.04`. A Linux binary cannot run on a system
whose glibc is older than the one it was built against, so the build image sets
the oldest distribution your users can be on — Ubuntu 24.04 and its glibc 2.39
in this case.

If you need to support older distributions, build on the oldest runner image
GitHub still supports and accept that the image will be retired eventually.
Runner images are deprecated on a schedule: check
[actions/runner-images](https://github.com/actions/runner-images) before
pinning an older one.

macOS and Windows do not have this problem. Their compatibility floors are set
by `bundle.macOS.minimumSystemVersion` and the WebView2 install mode, not by
the runner.

## Package formats

Add RPM or other formats only when the project has a supported distribution
channel for them. Every extra format is another artifact to sign, test, and
explain.
