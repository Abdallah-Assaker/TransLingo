FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Translator.API/Translator.API.csproj", "Translator.API/"]
RUN dotnet restore "Translator.API/Translator.API.csproj"
COPY . .
WORKDIR "/src/Translator.API"
RUN dotnet build "Translator.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Translator.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "Translator.API.dll"]