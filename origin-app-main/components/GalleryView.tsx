import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CONTRACT_ADDRESS, truncate } from "../utils/utils";
import CopyButton from "./CopyButton";
import OpenExternalButton from "./OpenExternalButton";
import { useWallet, useModal } from "@getpara/react-sdk";
import { useAuthState } from "@campnetwork/origin/react";
import { Description, Header } from "../src/components/shared";
import { Button } from "./Button";
import { gql, useApolloClient } from "@apollo/client";
import { useRef } from "react";


const QUERY = gql`
  query ipNFTs($first: Int!, $skip: Int!) {
    ipNFTs(
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      tokenId
      tokenURI
      attributes
      name
      description
      backgroundColor
      image
      parentId
      creator {
        id
      }
    }
  }
`;

const GalleryItem = ({
  tokenURI,
  name,
  image,
  creator,
  tokenId,
}: {
  tokenURI: string;
  name: string;
  image: string;
  creator?: string;
  tokenId?: string;
}) => {
  const [imgSrc, setImgSrc] = useState(image);
  const [imgName, setImgName] = useState(name);

  useEffect(() => {
    if (!image || !name) {
      fetch(tokenURI)
        .then((response) => response.json())
        .then((data) => {
          if (data.image) {
            setImgSrc(data.image);
          }
          if (data.name) {
            setImgName(data.name);
          }
        })
        .catch((error) => {
          console.error("Error fetching token URI:", error);
        });
    }
  }, [tokenURI, image, name]);

  return (
    <div className="relative flex flex-col items-center w-60 h-60 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
      <img
        src={imgSrc}
        alt={imgName}
        className=" shadow-md w-60 h-60 object-cover"
      />
      <div
        className="absolute bottom-0 left-0 w-full h-20 rounded-b"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7) 10%, rgba(0,0,0,0.0) 100%)",
        }}
      />
      <div className="absolute bottom-0 left-0 w-full">
        <div className="flex flex-row justify-between items-center px-3 pb-3 flex flex-row items-end justify-between z-10">
          <span className="text-[12px] text-white">{imgName}</span>
          <span className="text-[12px] text-white flex items-center gap-1">
            {truncate(creator as any, 4, 3)}{" "}
            <CopyButton value={creator as any} color="white" />{" "}
            <OpenExternalButton
              color="white"
              url={`https://basecamp.cloud.blockscout.com/token/${CONTRACT_ADDRESS}/instance/${tokenId}`}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

const GalleryView = ({ onSwitchToRemix }: { onSwitchToRemix: () => void }) => {
  const { data: wallet } = useWallet();
  const { authenticated } = useAuthState();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const fetchingRef = useRef(false);
  const BATCH_SIZE = 10;
  const scrollRef = useRef<HTMLDivElement>(null);
  const client = useApolloClient();
  const { openModal } = useModal();
  const fetchItems = async (reset = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const currentSkip = reset ? 0 : skip;

      const { data } = await client.query({
        query: QUERY,
        variables: { first: BATCH_SIZE, skip: currentSkip },
        fetchPolicy: "network-only",
      });
      if (reset) {
        setItems(data.ipNFTs);
        setSkip(BATCH_SIZE);
        setHasMore(data.ipNFTs.length === BATCH_SIZE);
      } else {
        setItems((prev: any[]) => {
          const ids = new Set(prev.map((i) => i.id));
          const filtered = data.ipNFTs.filter((i: any) => !ids.has(i.id));
          return [...prev, ...filtered];
        });
        setSkip((prev) => prev + BATCH_SIZE);
        setHasMore(data.ipNFTs.length === BATCH_SIZE);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.address, authenticated]);

  useEffect(() => {
    const el = scrollRef.current;
    if (
      el &&
      hasMore &&
      !loading &&
      items.length > 0 &&
      el.scrollHeight <= el.clientHeight
    ) {
      fetchItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hasMore, loading]);

  useEffect(() => {
    const handleScroll = () => {
      const el = scrollRef.current;
      if (!el || loading || !hasMore) return;
      const scrollable = el.scrollHeight - el.clientHeight;
      const scrolled = el.scrollTop;
      if (scrollable - scrolled < 200) {
        fetchItems();
      }
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore]);

  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.5,
      }}
      className="absolute top-40 left-0 right-0 bottom-0 flex flex-col items-center justify-start p-10 text-black overflow-y-auto"
      style={{
        background: "linear-gradient(to bottom, transparent 0%, #fff 100%)",
      }}
    >
      {!wallet?.address || !authenticated ? (
        <div className="flex flex-col items-center justify-center gap-2 my-10">
          <Header text="Sign in to start collecting." />
          <Description text="Browse newly minted IP remixed below." />
          <Button
            text="Connect Wallet"
            className="w-64 !self-center"
            arrow="right"
            onClick={() => {
              openModal();
            }}
          />
        </div>
      ) : null}
      <div
        className="grid gap-6 mt-8 w-full justify-center"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, max-content))",
        }}
      >
        {items.length === 0 && loading && (
          <div className="flex items-center justify-center w-full h-64">
            <span className="text-gray-500">Loading...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center w-full h-64">
            <span className="text-red-500">
              Error loading gallery: {error.message || error.toString()}
            </span>
          </div>
        )}
        {items.map((item: any) => (
          <GalleryItem
            tokenURI={item.tokenURI}
            key={item.id}
            name={item.name}
            creator={item.creator?.id}
            image={item.image}
            tokenId={item.tokenId}
          />
        ))}
      </div>
      {hasMore && items.length > 0 && (
        <div className="flex items-center justify-center w-full h-16 mt-4">
          <span className="text-gray-400">Loading more items...</span>
        </div>
      )}
    </motion.div>
  );
};

export default GalleryView;
