FROM rabbitmq:3.10-management
RUN apt-get update \
    && apt-get install -y curl \
    && apt-get clean
RUN rabbitmq-plugins enable --offline rabbitmq_web_mqtt
