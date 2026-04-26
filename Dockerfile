FROM node:alpine3.23

WORKDIR /app

# COPY . .

ADD --chmod=776 https://gist.githubusercontent.com/anonymousc/68b56e985cbc14b1750bf227f32def83/raw/7e9ad57b0483ddeda97037f4fc267a7af2af267b/Front-EntryPoint.sh /EntryPoint.sh

ENTRYPOINT [ "/EntryPoint.sh" ]